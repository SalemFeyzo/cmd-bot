require("dotenv").config();
const ccxt = require("ccxt");
const GateApi = require("gate-api");

const ccxtGateIoClient = new ccxt.gateio({
  enableRateLimit: true,
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
const currencyPair = "MART_USDT";
const baseCurrency = "USDT";
const currencyToBuy = "MART"; // "REVOLAND" , "WLKN" , "BTC"

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
    const buyVolume = availableUSDT / price - 10; // return how much curr to buy
    const sellVolume = boughtCurr * price; // return usdt
    const tradeStatus = currPairs.body.tradeStatus;
    const orders = await api.listAllOpenOrders();
    if (orders) {
      await api.cancelOrders(currencyPair, {
        side: "buy",
        account: "spot",
      });
      await api.cancelOrders(currencyPair, {
        side: "sell",
        account: "spot",
      });
    }

    const market = `${currencyToBuy}/${baseCurrency}`;
    console.log("buyVolume: ", buyVolume);
    console.log("sellVolume: ", sellVolume);
    console.log("USDT: ", availableUSDT);
    console.log("MART: ", boughtCurr);
    console.log("Price: ", price);

    if (price <= 0.2 && availableUSDT > 2) {
      try {
        const order = await ccxtGateIoClient.createLimitBuyOrder(
          market,
          buyVolume,
          price + 0.01
        );

        console.log("Buy status: ", order.status);
      } catch (error) {
        console.log("Buy error:", error.message);
      }
    } else if (price > 0.67 && sellVolume > 2) {
      try {
        const order = await ccxtGateIoClient.createLimitSellOrder(
          market,
          boughtCurr,
          price - 0.01
        );

        console.log("Sell status: ", order.status);
      } catch (error) {
        console.log("Sell error: ", error.message);
      }
    } else {
      console.log("Order status: Failed");
    }
  } catch (error) {
    console.error(error.message);
  }
};

ticker();
setInterval(ticker, 1000);
