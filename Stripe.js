const { getEnv } = require("./config");
const stripe = require("stripe")(getEnv("STRIPE_SECERET_KEY"));

console.log("In Stripe.js file");
const cardToken = async ({ card_number, exp_month, exp_year, cvc_number }) =>
  await stripe.tokens.create({
    card: {
      number: card_number,
      exp_month,
      exp_year,
      cvc: cvc_number,
    },
  });

const chargeCard = async ({
  amount,
  card_token,
  currency = "cad",
  description,
}) =>
  await stripe.charges.create({
    amount,
    currency,
    source: card_token,
    description,
  });

module.exports = { cardToken, chargeCard };
