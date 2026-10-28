export function marketPositioningEngine(data: any) {

/* =====================================================
INPUT
===================================================== */

const putCall =
Number(data.putCallRatio ?? 1);

const gamma =
Number(data.dealerGamma ?? 0);

const skew =
Number(data.skew ?? 1);

const vix =
Number(data.vix ?? 20);


/* =====================================================
COMPONENTS
===================================================== */

let sentimentScore = 0; // ±30

let gammaScore = 0; // ±30

let skewScore = 0; // ±20


/* =====================================================
PUT / CALL
===================================================== */

/*
Contrarian interpretation:

High Put/Call:
Crowd heavily bearish
→ potential bullish contrarian positioning

Low Put/Call:
Crowd complacent / heavily long
→ bearish positioning risk
*/

if (putCall > 1.3) {

sentimentScore += 30;

}

else if (putCall > 1.1) {

sentimentScore += 20;

}

else if (putCall < 0.7) {

sentimentScore -= 30;

}

else if (putCall < 0.8) {

sentimentScore -= 20;

}


/* =====================================================
DEALER GAMMA
===================================================== */

/*
Positive Gamma:

Dealer hedging tends to stabilize moves.


Negative Gamma:

Dealer hedging can amplify moves.
*/

if (gamma > 0) {

gammaScore += 20;

}

else if (gamma < 0) {

gammaScore -= 20;

}


/*
Strong negative gamma:

additional acceleration risk
*/

if (gamma < -1) {

gammaScore -= 10;

}


/* =====================================================
SKEW
===================================================== */

/*
High skew:

Strong downside hedging.

Contrarian interpretation:
fear already positioned.


Low skew:

Complacency.
*/

if (skew > 1.2) {

skewScore += 20;

}

else if (skew > 1.1) {

skewScore += 10;

}

else if (skew < 0.9) {

skewScore -= 20;

}


/* =====================================================
TOTAL SCORE
===================================================== */

let total =

sentimentScore +

gammaScore +

skewScore;


/*
Normalize around neutral = 50
*/

total =
Math.max(
0,
Math.min(
100,
50 + total
)
);


total =
Math.round(total);


/* =====================================================
BIAS
===================================================== */

let bias =
"NEUTRAL";


if (total >= 65) {

bias =
"BULLISH";

}

else if (total <= 35) {

bias =
"BEARISH";

}


/* =====================================================
CROWDING
===================================================== */

let crowding =
"CLEAN";


/*
Crowded Long:

Low Put/Call
+ low skew

→ complacent / insufficient downside hedging
*/

if (

putCall < 0.7 &&

skew < 0.9

) {

crowding =
"CROWDED LONG";

}


/*
Crowded Short:

High Put/Call
+ high skew

→ heavy downside positioning
*/

else if (

putCall > 1.3 &&

skew > 1.2

) {

crowding =
"CROWDED SHORT";

}


/*
Squeeze Zone:

Negative gamma
+ positioning near neutral

→ unstable environment
*/

else if (

gamma < 0 &&

Math.abs(total - 50) < 10

) {

crowding =
"SQUEEZE ZONE";

}


/* =====================================================
MARKET STATE
===================================================== */

let state =
"NEUTRAL";


/*
Priority is important.

RISK_OFF must override generic UNSTABLE.
*/

if (

gamma < 0 &&

vix > 25

) {

state =
"RISK_OFF";

}


else if (

gamma < 0

) {

state =
"UNSTABLE";

}


else if (

gamma > 0 &&

vix < 20

) {

state =
"RISK_ON";

}


/* =====================================================
RETURN
===================================================== */

return {

bias,

crowding,

state,

score: total,


components: {

putCall,

gamma,

skew,

vix

}

};

}
