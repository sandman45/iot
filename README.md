# Setup Raspberry Pi & AWS IoT

From AWS IoT in the AWS Console. 

- Connect one device

## Raspberry Pi SSH

SSH INFO

device-name: `prototype1pi`

username: `pro`

password: `admin`

Device: `Raspberry Pi`

OS: `Raspberry PI OS (64-bit)`

Storage: `Apple SDXC Reader Media`

```
ssh pi@<IP_ADDRESS>

ssh pro@192.168.0.194 ( current pi prototype )
```



## Prepare your Device
1. Turn on your device and make sure it's connected to the internet.
 
2. Choose how you want to load files onto your device.
   - If your device supports a browser, open the AWS IoT console on your device and run this wizard. You can download the files directly to your device from the browser.
   - If your device doesn't support a browser, choose the best way to transfer files from the computer with the browser to your device. Some options to transfer files include using the file transfer protocol (FTP) and using a USB memory stick.
3. Make sure that you can access a command-line interface on your device.
   - If you're running this wizard on your IoT device, open a terminal window on your device to access a command-line interface.
   - If you're not running this wizard on your IoT device, open an SSH terminal window on this device and connect it to your IoT device.
4. From the terminal window, enter this command:
 
   ```ping a2ub2jt7lbfxj-ats.iot.us-east-1.amazonaws.com```

After you complete these steps and get a successful ping response, you're ready to continue and connect your device to AWS IoT.   

## Register and secure your device
Thing properties

Thing name: `prototype_1`
  

## Choose platform and SDK

Platform & SDK

- Linux / macOS
- Windows v10

AWS IoT Device SDK

- Node.js v14+
  - requires Node.js and npm to be installed
- Python v3.8+
  - requires Python and Git to be installed
- Java v8
  - requires Java SDK, Maven, and Git to be installed

Suggested choices:

  - Device OS: `Linux / macOS`
   
  - AWS IoT Device SDK: `Node.js`




## Download Connection kit

- certificate: `prototype_1.cert.pem`
- private key: `prototype_1.private.key`
- AWS IoT Device SDK: `Node.js`
- Script to send and receive messages: `start.sh`
- Policy: `prototype_1-Policy`

```javascript

{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iot:Publish",
        "iot:Receive",
        "iot:PublishRetain"
      ],
      "Resource": [
        "arn:aws:iot:us-east-1:891377364943:topic/sdk/test/java",
        "arn:aws:iot:us-east-1:891377364943:topic/sdk/test/python",
        "arn:aws:iot:us-east-1:891377364943:topic/sdk/test/js"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "iot:Subscribe"
      ],
      "Resource": [
        "arn:aws:iot:us-east-1:891377364943:topicfilter/sdk/test/java",
        "arn:aws:iot:us-east-1:891377364943:topicfilter/sdk/test/python",
        "arn:aws:iot:us-east-1:891377364943:topicfilter/sdk/test/js"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "iot:Connect"
      ],
      "Resource": [
        "arn:aws:iot:us-east-1:891377364943:client/sdk-java",
        "arn:aws:iot:us-east-1:891377364943:client/basicPubSub",
        "arn:aws:iot:us-east-1:891377364943:client/sdk-nodejs-*"
      ]
    }
  ]
}

```

put the zip on your device

unzip using following command:

```unzip connect_device_package.zip```

## Run connection kit

Step 1: add execution permissions
on the device launch terminal window and run the following command:

```
chmod +x start.sh
```

Step 2: Run the script
```
./start.sh
```

Step 3: Return to the AWS IoT > Connect > Connect one device console

After running the start script, return to this screen to see the messages between your device and AWS IoT. The messages from your device appear in the following list.


---



**Device prep / setup**

1. Prep the Raspberry Pi
   
   Update:
   ```
   sudo apt update
   sudo apt upgrade -y
   ```
   install tools:
   
   ```sudo apt install -y git build-essential```

2. Install Node.js
   
   ```
   node -v
   
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   node -v
   npm -v
   
   ```

3. Create an AWS IoT Thing
      
   ``` 
   In the AWS Console:

   - Go to AWS IoT Core
   
   - Manage → Things → Create things
   
   - Choose Create a single thing
   
   - Give it a name (e.g. raspi-01)
   
   - Choose Auto-generate a new certificate
   
   - Download all 4 files:
   
   - Device certificate
   
   - Private key
   
   -Public key
   
   - Amazon Root CA
   ```

⚠️ Don’t lose these — especially the private key. ⚠️


4. Attach a policy (very important)

   (basic example)
     
      ```javascript
      {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "iot:Connect",
              "iot:Publish",
              "iot:Subscribe",
              "iot:Receive"
            ],
            "Resource": "*"
          }
        ]
      }
      
      ```
   
   Attach this policy to:
   - The certificate
   
   - (Optional but recommended) Attach the certificate to your Thing
   

5. Copy certs to your Raspberry Pi

   On your Pi:
   ```
   mkdir -p ~/aws-iot/certs
   ```
   Copy these files into that folder:

   - device.pem.crt
   
   - private.pem.key
   
   - AmazonRootCA1.pem
   
   Example:
   ```
   ~/aws-iot/certs/
   ├── device.pem.crt
   ├── private.pem.key
   └── AmazonRootCA1.pem

   ```

6. Get your IoT endpoint

   In AWS IoT Core:
   
   Settings
   
   Copy your endpoint, it looks like:
   
   ```
   xxxxxxxxxxxx-ats.iot.us-east-1.amazonaws.com
   
   ```
   
   You'll need this in code.

7. Install AWS IoT Device SDK for Node.js 

   Create a project folder:

   ```
   cd ~/aws-iot
   npm init -y
   npm install aws-iot-device-sdk-v2

   ```
   
8. Test Connection ( Node.js example )
   
   Create a file:
    ```
   nano index.js
   ```
   
   Paste this and replace the paths + endpoints:

   ```javascript
   
   const { mqtt, iot } = require('aws-iot-device-sdk-v2');
   const path = require('path');
   
   const clientBootstrap = new mqtt.ClientBootstrap();
   const config = iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder_from_path(
    path.join(__dirname, 'certs/device.pem.crt'),
    path.join(__dirname, 'certs/private.pem.key')
    ).with_certificate_authority_from_path(
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
   console.log('Connected to AWS IoT');
   
   await connection.publish(
   'raspi/test',
   JSON.stringify({ message: 'Hello from Raspberry Pi!' }),
   mqtt.QoS.AtLeastOnce
   );
   
   console.log('Message published');
   })();

   ```
   Run it:

   ```
   node index.js
   ```
   
9. Verify in AWS IoT:

   In AWS Console:

   - MQTT test client
   
   - Subscribe to:

   ```
   raspi/test
   ```
   
   If you see the message 🎉 you’re officially connected.