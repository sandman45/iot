const { mqtt5, iot } = require('aws-iot-device-sdk-v2');

const path = require('path');

const clientId = 'sdk-nodejs-v2'; // this name matters UGH!!
const cert = path.join(__dirname, '/certs/prototype_1.cert.pem');
const key = path.join(__dirname, '/certs/prototype_1.private.key');
const certAuthority = path.join(__dirname, '/certs/root-CA.crt');
const endpoint = 'a2ub2jt7lbfxj-ats.iot.us-east-1.amazonaws.com';
const topic = 'sdk/test/js';

console.log(`starting device: ${clientId}`);
console.log(`cert path: ${cert}`);
console.log(`private key path: ${key}`);
console.log(`root cert path: ${certAuthority}`);
console.log(`endpoint: ${endpoint}`);

let builder;
builder = iot.AwsIotMqtt5ClientConfigBuilder.newDirectMqttBuilderWithMtlsFromPath(
    endpoint,
    cert,
    key
);

builder.withCertificateAuthorityFromPath(undefined, certAuthority);

builder.withConnectProperties({
    clientId: clientId,
    keepAliveIntervalSeconds: 1200
});

const config = builder.build();
const client = new mqtt5.Mqtt5Client(config);

client.on('error', (error) => {
    console.log(error);
});

client.on('attemptingConnect', () => {
    console.log('Attempting MQTT5 connection...');
});

client.on('connectionSuccess', (event) => {
    console.log('connected.');
    client.subscribe({
        subscriptions: [{
            topicFilter: topic,
            qos: mqtt5.QoS.AtLeastOnce
        }]
    });
});

client.on('messageReceived', (event) => {
   const payload = Buffer.from(event.message.payload).toString('utf8');
   console.log(`Recieved Message: ${payload}, on topic: ${event.message.topicName}`);
   const commandObj = JSON.parse(payload);
    if(commandObj.action === 'OPEN') {
        console.log(`action ${commandObj.action} received.`);
        console.log(`sending command ${commandObj.action} to GPIO`);
    } else if (commandObj.action === 'CLOSE') {
        console.log(`action ${commandObj.action} received.`);
        console.log(`sending command ${commandObj.action} to GPIO`);
    }
});

client.on('connectionFailure', (event) => {
    console.error(`Connection Failure: ${event.error}`);
});

client.on('disconnection',() => {
   console.log('Disconnected.');
});

client.start();

const deviceHeartBeat = function (){
    setTimeout(() => {
        const message = {
            message: `${clientId} Client is alive!`
        }
        client.publish({
            topicName: topic,
            payload: JSON.stringify(message),
            qos: mqtt5.QoS.AtLeastOnce
        });
        // deviceHeartBeat();
    },5000);
}

deviceHeartBeat();