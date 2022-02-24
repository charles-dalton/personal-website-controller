const express = require('express')
const request = require('request')
const cors = require('cors')
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');

const app = express()
const port = 3000

app.get('/', cors(), async (req, res) => {
    const databasePassword = await getDatabasePassword();

    console.log('base64: ' + Buffer.from(databasePassword).toString('base64'));

    const options = {
        url: 'http://headless-neo4j.default.svc.cluster.local:7474/db/data/transaction/commit',
        headers: {
            'Authorization': 'Basic ' + Buffer.from("neo4j:" + databasePassword).toString('base64')
        },
        json: {
            "statements" : [{
                "statement" : "MATCH (n) OPTIONAL MATCH (n)-[r]-() RETURN n, r",
                "resultDataContents":["graph"]
            }]
        }
    }

  request.post(options,
    (error, response, body) => {
      console.error('error:', error); // Print the error if one occurred
      console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      console.log('body:', body);
      res.send(body);
  })
})

const getDatabasePassword = async () => {
    const client = new SecretManagerServiceClient();

    const [version] = await client.accessSecretVersion({
        name: "projects/870208510605/secrets/neo4j-password/versions/1"
    });

    return version.payload.data.toString();
};

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
