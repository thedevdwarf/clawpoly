import { GameState, GameEvent } from '../types/game';
import { GamePlayerResult } from '../types/mongo';
import { GameModel } from '../models/Game';
import { GameEventModel } from '../models/GameEvent';
import { AgentModel } from '../models/Agent';
import { calculateNetWorth } from '../engine/bankruptcy';

export async function persistGame(state: GameState, events: GameEvent[]): Promise<string> {
  const now = new Date().toISOString();
  const startedAt = events.length > 0 ? events[0].timestamp : now;
  const finishedAt = events.length > 0 ? events[events.length - 1].timestamp : now;
  const duration = new Date(finishedAt).getTime() - new Date(startedAt).getTime();

  // Calculate final standings
  const bankruptPlayers = state.players.filter((p) => p.isBankrupt);
  const alivePlayers = state.players.filter((p) => !p.isBankrupt);

  // Sort alive players by net worth descending
  const aliveRanked = alivePlayers
    .map((p) => ({ player: p, netWorth: calculateNetWorth(p, state.board) }))
    .sort((a, b) => b.netWorth - a.netWorth);

  // Bankrupt players: last bankrupt = worst placement
  // We find bankrupt order from events
  const bankruptOrder: string[] = [];
  for (const evt of events) {
    if (evt.type === 'bankruptcy' && evt.playerId) {
      bankruptOrder.push(evt.playerId);
    }
  }

  const totalPlayers = state.players.length;
  const players: GamePlayerResult[] = [];

  // Alive players get placements 1..aliveRanked.length
  for (let i = 0; i < aliveRanked.length; i++) {
    const p = aliveRanked[i].player;
    players.push({
      id: p.id,
      name: p.name,
      token: p.token,
      strategy: 'agent',
      finalMoney: p.money,
      finalProperties: [...p.properties],
      finalOutposts: p.properties.reduce((sum, idx) => sum + (state.board[idx]?.outposts || 0), 0),
      finalFortresses: p.properties.reduce((sum, idx) => sum + (state.board[idx]?.fortress ? 1 : 0), 0),
      placement: i + 1,
      isBankrupt: false,
      bankruptAtTurn: null,
    });
  }

  // Bankrupt players: first bankrupt gets worst placement
  for (let i = 0; i < bankruptOrder.length; i++) {
    const pid = bankruptOrder[i];
    const p = state.players.find((pl) => pl.id === pid);
    if (!p) continue;
    players.push({
      id: p.id,
      name: p.name,
      token: p.token,
      strategy: 'agent',
      finalMoney: p.money,
      finalProperties: [...p.properties],
      finalOutposts: 0,
      finalFortresses: 0,
      placement: totalPlayers - i,
      isBankrupt: true,
      bankruptAtTurn: null, // Could extract from events if needed
    });
  }

  // Add any bankrupt players not found in events
  for (const p of bankruptPlayers) {
    if (!players.find((pl) => pl.id === p.id)) {
      players.push({
        id: p.id,
        name: p.name,
        token: p.token,
        strategy: 'agent',
        finalMoney: 0,
        finalProperties: [],
        finalOutposts: 0,
        finalFortresses: 0,
        placement: totalPlayers,
        isBankrupt: true,
        bankruptAtTurn: null,
      });
    }
  }

  const winnerId = state.winner?.id || aliveRanked[0]?.player.id || state.players[0].id;

  const gameDoc = await GameModel.create({
    roomId: state.roomId,
    roomCode: state.roomCode,
    name: state.roomName,
    status: 'finished',
    config: {
      maxPlayers: state.players.length,
      turnLimit: state.turnLimit || 200,
      gameSpeed: state.gameSpeed,
    },
    players,
    winnerId,
    totalTurns: state.turnNumber,
    startedAt,
    finishedAt,
    duration,
  });

  const gameId = gameDoc._id.toString();

  // Batch insert events
  if (events.length > 0) {
    const eventDocs = events.map((e) => ({
      gameId,
      roomId: e.roomId,
      sequence: e.sequence,
      turnNumber: e.turnNumber,
      type: e.type,
      playerId: e.playerId,
      data: e.data,
      timestamp: e.timestamp,
    }));
    await GameEventModel.insertMany(eventDocs);
  }

  return gameId;
}

export async function updateAgentStats(state: GameState): Promise<void> {
  const now = new Date().toISOString();
  const winnerId = state.winner?.id || null;
  const numLosers = state.players.length - 1;
  const eloLoss = numLosers > 0 ? Math.round(16 / numLosers) : 0;
  const duration = 0; // Could be calculated if we had timestamps

  for (const player of state.players) {
    const isWinner = player.id === winnerId;

    const existing = await AgentModel.findOne({ agentId: player.id });

    if (existing) {
      const stats = existing.stats;
      const newGamesPlayed = stats.gamesPlayed + 1;
      const newWins = stats.wins + (isWinner ? 1 : 0);
      const newLosses = stats.losses + (isWinner ? 0 : 1);
      const newWinRate = newGamesPlayed > 0 ? newWins / newGamesPlayed : 0;
      const placement = isWinner ? 1 : state.players.length; // simplified
      const newAvgPlacement =
        (stats.avgPlacement * stats.gamesPlayed + placement) / newGamesPlayed;

      await AgentModel.updateOne(
        { agentId: player.id },
        {
          $set: {
            name: player.name,
            lastPlayedAt: now,
            'stats.gamesPlayed': newGamesPlayed,
            'stats.wins': newWins,
            'stats.losses': newLosses,
            'stats.winRate': Math.round(newWinRate * 10000) / 10000,
            'stats.avgPlacement': Math.round(newAvgPlacement * 100) / 100,
            'stats.bankruptcies': stats.bankruptcies + (player.isBankrupt ? 1 : 0),
            elo: existing.elo + (isWinner ? 16 : -eloLoss),
          },
        }
      );
    } else {
      await AgentModel.create({
        agentId: player.id,
        name: player.name,
        createdAt: now,
        lastPlayedAt: now,
        elo: 1000 + (isWinner ? 16 : -eloLoss),
        stats: {
          gamesPlayed: 1,
          wins: isWinner ? 1 : 0,
          losses: isWinner ? 0 : 1,
          winRate: isWinner ? 1 : 0,
          totalShellsEarned: 0,
          totalShellsSpent: 0,
          propertiesBought: 0,
          outpostsBuilt: 0,
          fortressesBuilt: 0,
          timesInLobsterPot: 0,
          bankruptcies: player.isBankrupt ? 1 : 0,
          avgPlacement: isWinner ? 1 : state.players.length,
          avgGameDuration: duration,
        },
      });
    }
  }
}
