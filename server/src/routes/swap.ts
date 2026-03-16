import { Router } from 'express';

const router = Router();

const ZEROX_API = 'https://api.0x.org';
const CHAIN_ID = '8453'; // Base

function zeroxHeaders() {
  return {
    '0x-api-key': process.env.ZEROX_API_KEY || '',
    '0x-version': 'v2',
    'Content-Type': 'application/json',
  };
}

// GET /api/v1/swap/quote
// Proxies 0x Permit2 quote to hide API key
router.get('/quote', async (req, res) => {
  try {
    const { buyToken, sellToken, sellAmount, buyAmount, taker } = req.query;

    if (!buyToken || !sellToken || (!sellAmount && !buyAmount)) {
      return res.status(400).json({ error: 'Missing required params: buyToken, sellToken, sellAmount or buyAmount' });
    }

    const url = new URL(`${ZEROX_API}/swap/permit2/quote`);
    url.searchParams.set('chainId', CHAIN_ID);
    url.searchParams.set('buyToken', buyToken as string);
    url.searchParams.set('sellToken', sellToken as string);
    if (sellAmount) url.searchParams.set('sellAmount', sellAmount as string);
    if (buyAmount) url.searchParams.set('buyAmount', buyAmount as string);
    if (taker) url.searchParams.set('taker', taker as string);

    const resp = await fetch(url.toString(), { headers: zeroxHeaders() });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/swap/price
// Lightweight price check (no taker required)
router.get('/price', async (req, res) => {
  try {
    const { buyToken, sellToken, sellAmount } = req.query;

    if (!buyToken || !sellToken || !sellAmount) {
      return res.status(400).json({ error: 'Missing required params' });
    }

    const url = new URL(`${ZEROX_API}/swap/permit2/price`);
    url.searchParams.set('chainId', CHAIN_ID);
    url.searchParams.set('buyToken', buyToken as string);
    url.searchParams.set('sellToken', sellToken as string);
    url.searchParams.set('sellAmount', sellAmount as string);

    const resp = await fetch(url.toString(), { headers: zeroxHeaders() });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
