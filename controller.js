/*
  Controller Setup
*/
var state = "booting";
var pinStateLED = D23;
var runtime = 0;
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
      port: 8080,
      protocol : "echo-protocol",
      protocolVersion: 13 }
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

  ws.on('message', function(msg) {
    console.log("MSG: " + msg);
  });
}

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

/*
  State Control
*/
function setState(newState){
  state = newState;
  console.log(state);
  return state;
}

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

