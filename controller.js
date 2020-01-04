/*
  Controller Setup
*/
var state = "booting";
var pinStateLED = D23;
var runtime = 0;
var config = {};

pinStateLED.mode('output');
digitalWrite(pinStateLED, 0);

/*
  Backend Setup
*/
var backendHost = "192.168.178.20";
var WebSocket = require("ws");
var ws = null;
var reconnectInterval = -1;

function openBackendSocket(){
  console.log('Opening WebSocket to backend...');
  setState("connecting");
  ws = new WebSocket(backendHost,{
      path: '/',
      port: 3000,
      protocol : "echo-protocol",
      protocolVersion: 13 
    }
  );

  ws.on('open', function() {
    console.log('WebSocket online.');
    clearInterval(reconnectInterval);
    setState("ready");
  });
  ws.on('close', function() {
    console.log('WebSocket closed. Try reconnect in 10 seconds.');
    reconnectInterval = setInterval(function(){
      try {
        openBackendSocket();
      } catch(e){
        console.log('WebSocket reconnection failed.');
      }
    },10000);
  });

  ws.on('message', function(configstr) {
    processConfig(JSON.parse(configstr));
  });
}

/*
  Relay Setup
  Control Relays via pins to power other componentns
*/
var pinRelayWater = D19; // Water Pump of reservoir
var stateWater = 1;

var pinRelayAir = D18; // Air Pump of reservoir
var stateAir = 1;

var pinRelayLamp1 = D5; // Light-Row 1
var stateLamp1 = 1;
var pinRelayLamp2 = D17; // Light-Row 2
var stateLamp2 = 1;
var pinRelayLamp3 = D16; // Light-Row 3
var stateLamp3 = 1;

pinRelayWater.mode('output');
pinRelayAir.mode('output');
pinRelayLamp1.mode('output');
pinRelayLamp2.mode('output');
pinRelayLamp3.mode('output');

// initially turn them all off
digitalWrite(pinRelayWater, stateWater);
digitalWrite(pinRelayAir, stateAir);
digitalWrite(pinRelayLamp1, stateLamp1);
digitalWrite(pinRelayLamp2, stateLamp2);
digitalWrite(pinRelayLamp3, stateLamp3);

/*
  State Control
*/
function setState(newState){
  state = newState;
  return state;
}

/*
  Water Control
*/
function turnPumpsOn(){
  stateWater = 0;
  digitalWrite(pinRelayWater, stateWater);
  console.log('turned pumps on');
}
function turnPumpsOff(){
  stateWater = 1;
  digitalWrite(pinRelayWater, stateWater);
  console.log('turned pumps off');
}
/*
  Config Control
*/
function processConfig(configObj){
  config = configObj;
  if(config.power.waterPumps){
    if(stateWater != 0) turnPumpsOn();
  } else {
    if(stateWater != 1) turnPumpsOff();  
  }
}

/*
  Initial Run
*/

console.log('Booting done.');

// state led control
setInterval(()=>{
  
  if(state == "no connection"){
    runtime++;
    if(runtime % 3){
      digitalWrite(pinStateLED, 1);  
    } else {
      digitalWrite(pinStateLED, 0);
    }
  }
  
  if(state == "ready"){
    digitalWrite(pinStateLED, 1);
    runtime = 0;
  }
},500);

// try connection
setTimeout(()=>{
  try {
    openBackendSocket();
  } catch(e){
    console.log('WebSocket connection failed.');
    setState("no connection");
  }
},500);

