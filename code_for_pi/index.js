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
    .with_endpoint('a2ub2jt7lbfxj-ats.iot.us-east-1.amazonaws.com')
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