require("dotenv").config();
const ccxt = require("ccxt");
const GateApi = require("gate-api");

const ccxtGateIoClient = new ccxt.gateio({
  apiKey: process.env.GATE_IO_API_KEY,
  secret: process.env.GATE_IO_SECRET,
});

const client = new GateApi.ApiClient();
client.setApiKeySecret(
  `${process.env.GATE_IO_API_KEY}`,
  `${process.env.GATE_IO_SECRET}`
);
const api = new GateApi.SpotApi(client);

// string | Currency pair
const currencyPair = "ARSW_USDT";
const baseCurrency = "USDT";
const currencyToBuy = "ARSW"; // "REVOLAND" , "WLKN" , "BTC"

const ticker = async () => {
  try {
    const currPairs = await api.getCurrencyPair(currencyPair);
    const tickers = await api.listTickers({ currencyPair });
    const usdtAccountBalance = await api.listSpotAccounts({
      currency: baseCurrency,
    });
    const boughtCurrAccountBalance = await api.listSpotAccounts({
      currency: currencyToBuy,
    });
    const availableUSDT = Number(usdtAccountBalance.body[0].available);
    const boughtCurr = Number(boughtCurrAccountBalance.body[0].available);
    const price = Number(tickers.body[0].highestBid);
    const buyVolume = availableUSDT / price;
    const sellVolume = boughtCurr * price;
    const tradeStatus = currPairs.body.tradeStatus;

    await api.cancelOrders(currencyPair, {
      side: "buy",
      account: "spot",
    });

    const market = `${currencyToBuy}/${baseCurrency}`;

    console.log("USDT: ", availableUSDT);
    console.log("ARSW: ", boughtCurr);
    console.log("Price: ", price);

    if (price <= 0.04 && buyVolume > 0) {
      await ccxtGateIoClient.createLimitBuyOrder(
        market,
        availableUSDT,
        price + 0.001
      );
      console.log(`Success buy`);
    } else if (price > 0.12 && sellVolume > 1) {
      await ccxtGateIoClient.createLimitSellOrder(
        market,
        boughtCurr,
        price - 0.001
      );
      console.log(`Success sell`);
    } else {
      console.log("Failed");
    }
  } catch (error) {
    console.error(error);
  }
};

ticker();
setInterval(ticker, 100);
