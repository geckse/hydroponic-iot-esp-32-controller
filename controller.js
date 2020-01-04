/*
  Relay Setup
  Control Relays via pins to power other componentns
*/
var pinRelayWater = D19; // Water Pump of reservoir
var pinRelayAir = D18; // Air Pump of reservoir
var pinRelayLamp1 = D5; // Light-Row 1
var pinRelayLamp2 = D17; // Light-Row 2
var pinRelayLamp3 = D16; // Light-Row 3

pinRelayWater.mode('output');
pinRelayAir.mode('output');
pinRelayLamp1.mode('output');
pinRelayLamp2.mode('output');
pinRelayLamp3.mode('output');

// initially turn them all off
digitalWrite(pinRelayWater, 1);
digitalWrite(pinRelayAir, 1);
digitalWrite(pinRelayLamp1, 1);
digitalWrite(pinRelayLamp2, 1);
digitalWrite(pinRelayLamp3, 1);

console.log('Booting done.');

/*
  Water Control
*/
function turnPumpsOn(){
  digitalWrite(pinRelayWater, 0);
  console.log('turned pumps on');
}
function turnPumpsOff(){
  digitalWrite(pinRelayWater, 1);
  console.log('turned pumps off');
}

/*
  Testing
*/
setTimeout(()=>{
  turnPumpsOn();
},3000);
