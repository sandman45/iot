# AWS IoT → Node.js → GPIO



## Big picture flow

AWS sends a command (MQTT message)

Node.js subscribes to a topic

Message arrives → parse command

Toggle / control GPIO pins

### Install a GPIO library (Node.js)

On Raspberry Pi, the most reliable choice right now is onoff.

```
cd ~/aws-iot
npm install onoff
```

Quick test to make sure GPIO works:

```
node -e "require('onoff').Gpio(17, 'out').writeSync(1)"
```

(LED should turn on if wired to GPIO17)


### Basic GPIO setup

Example: LED or relay on GPIO17.

```javascript
const { Gpio } = require('onoff');

const motor = new Gpio(5, 'out');

// turn ON
motor.writeSync(1);

// turn OFF
motor.writeSync(0);

```

### Define your command format

Keep it simple and explicit.

Example MQTT payload:
```javascript
{
  "pin": 17,
  "action": "on"
}

```

Topic example:

```
raspi/command/gpio
```

### Subscribe to AWS IoT commands

Update your Node.js code to subscribe + react.

```javascript
const { mqtt, iot } = require('aws-iot-device-sdk-v2');
const { Gpio } = require('onoff');
const path = require('path');

const led = new Gpio(17, 'out');

const clientBootstrap = new mqtt.ClientBootstrap();
const config = iot.AwsIotMqttConnectionConfigBuilder
  .new_mtls_builder_from_path(
    path.join(__dirname, 'certs/device.pem.crt'),
    path.join(__dirname, 'certs/private.pem.key')
  )
  .with_certificate_authority_from_path(
    undefined,
    path.join(__dirname, 'certs/AmazonRootCA1.pem')
  )
  .with_client_id('raspi-01')
  .with_endpoint('YOUR_ENDPOINT_HERE')
  .build();

const client = new mqtt.MqttClient(clientBootstrap);
const connection = client.new_connection(config);

(async () => {
  await connection.connect();
  console.log('Connected');

  await connection.subscribe(
    'raspi/command/gpio',
    mqtt.QoS.AtLeastOnce,
    (topic, payload) => {
      const msg = JSON.parse(payload.toString());
      console.log('Command received:', msg);

      if (msg.action === 'on') {
        led.writeSync(1);
      } else if (msg.action === 'off') {
        led.writeSync(0);
      }
    }
  );
})();

```

### Send a command from AWS

In AWS IoT → MQTT test client:

Topic

```
raspi/command/gpio

```

Payload

```
{ "action": "on" }
```

Then:
```
{ "action": "off" }
```

LED toggles instantly ⚡


### Multiple pins (scales cleanly)

If you want to control many GPIO pins:

```javascript
const pins = {
  17: new Gpio(17, 'out'),
  27: new Gpio(27, 'out'),
};

function handleCommand({ pin, action }) {
  if (!pins[pin]) return;

  pins[pin].writeSync(action === 'on' ? 1 : 0);
}

```

### Safety & cleanup (important)

Always release GPIO on exit:

```javascript
process.on('SIGINT', () => {
  led.unexport();
  process.exit();
});

```

### Best practices (learned the hard way)

🔒 Whitelist pins (don’t allow arbitrary GPIO numbers)

🧠 Validate payloads (JSON.parse can crash your app)

⚡ Use relays for high voltage (never drive mains directly)

🔁 Use Device Shadow if you want state persistence