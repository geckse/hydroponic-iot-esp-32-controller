/*
  Config
*/
var ssid = '';
var password = '';
var backendHost = "192.168.178.20";
var backendPort = 3000;

/*
  Connect ESP 32 to Wifi
*/
var wifi = require('Wifi');
function connectWifi(){
  console.log('Connecting to Wifi...');
  wifi.setHostname("esp-32-hydroponic-controller");
  wifi.setConfig({
    powersave: 'none'
  }); // we don't want to close connection due to our websocket
  wifi.connect(ssid, {password: password}, function() {
    console.log('Connected to Wifi.  IP address is:', wifi.getIP().ip);
    wifi.save(); // save for auto connect
  });
}
function reconnect(){
  if(wifi.getStatus().station == "NO_AP_FOUND" || wifi.getStatus().station == "BEACON_TIMEOUT"){
      console.log("Wifi Error:");
      console.log(wifi.getStatus());
      // reconnect wifi
      connectWifi();
  } else {
    // try backend again
    try {
      openBackendSocket();
    } catch(e){
      console.log('WebSocket reconnection failed.');
      setState("no connection");
    }
  }
}

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
var WebSocket = require("ws");
var ws = null;
var reconnectInterval = -1;

function openBackendSocket(){
  console.log('Opening WebSocket to backend '+backendHost+':'+backendPort+' ...');
  setState("connecting");
  ws = new WebSocket(backendHost,{
      path: '/',
      port: backendPort,
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
    console.log('WebSocket closed. Try reconnect every 10 seconds.');
    setState("no connection");
    reconnect();
    reconnectInterval = setInterval(reconnect,10000);
  });

  ws.on('message', function(configstr) {
    digitalWrite(pinStateLED, 0); // blink status led as feedback
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
  Relay related components
*/
function turnWaterOn(){
  stateWater = 0;
  digitalWrite(pinRelayWater, stateWater);
  console.log('turned pumps on');
}
function turnWaterOff(){
  stateWater = 1;
  digitalWrite(pinRelayWater, stateWater);
  console.log('turned pumps off');
}
function turnAirOn(){
  stateAir = 0;
  digitalWrite(pinRelayAir, stateAir);
  console.log('turned air on');
}
function turnAirOff(){
  stateAir = 1;
  digitalWrite(pinRelayAir, stateAir);
  console.log('turned air off');
}
function turnLampOn(ind){
  if(ind == 1){
    stateLamp1 = 0;  
    digitalWrite(pinRelayLamp1, stateLamp1);
  }
  if(ind == 2){
    stateLamp2 = 0;  
    digitalWrite(pinRelayLamp2, stateLamp2);
  }
  if(ind == 3){
    stateLamp3 = 0;  
    digitalWrite(pinRelayLamp3, stateLamp3);
  }
  console.log('turned lamp'+ind+' on');
}
function turnLampOff(ind){
  if(ind == 1){
    stateLamp1 = 1;  
    digitalWrite(pinRelayLamp1, stateLamp1);
  }
  if(ind == 2){
    stateLamp2 = 1;  
    digitalWrite(pinRelayLamp2, stateLamp2);
  }
  if(ind == 3){
    stateLamp3 = 1;  
    digitalWrite(pinRelayLamp3, stateLamp3);
  }
  console.log('turned lamp'+ind+' off');
}



/*
  Config Processing
*/
function processConfig(configObj){
  config = configObj;
  
  // water
  if(config.power.waterPumps){
    if(stateWater != 0) turnWaterOn();
  } else {
    if(stateWater != 1) turnWaterOff();  
  }
  
  // air
  if(config.power.airPumps){
    if(stateAir != 0) turnAirOn();
  } else {
    if(stateAir != 1) turnAirOff();  
  }
  
  // lamp1
  if(config.power.lamp1){
    if(stateLamp1 != 0) turnLampOn(1);
  } else {
    if(stateLamp1 != 1) turnLampOff(1);  
  }

  // lamp2
  if(config.power.lamp2){
    if(stateLamp2 != 0) turnLampOn(2);
  } else {
    if(stateLamp2 != 1) turnLampOff(2);  
  }

  // lamp3
  if(config.power.lamp3){
    if(stateLamp3 != 0) turnLampOn(3);
  } else {
    if(stateLamp3 != 1) turnLampOff(3);  
  }
  
}

/*
  Initial Run
*/

console.log('Booting done.');

// connect to wifi
connectWifi();

// short delay for wifi
setTimeout(()=>{
  
  // try connection
  try {
    openBackendSocket();
  } catch(e){
    console.log('WebSocket connection failed.');
    setState("no connection");  
    reconnectInterval = setInterval(reconnect,10000);
  }
  
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
    
    // we are fine?
    if(state == "ready"){
      digitalWrite(pinStateLED, 1);
      runtime = 0;
    }
    
    // check if wifi error
    if(state != "no connection" && wifi.getStatus().station == "NO_AP_FOUND"){
      console.log("WIFI Error:");
      console.log(wifi.getStatus());
      setState("no connection");
    }
    
  },500);
  
},500);

