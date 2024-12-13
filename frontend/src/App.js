import React, { useState, useEffect } from "react";
import "./index.css";
import ReactSpeedometer from "react-d3-speedometer";
import { IgrDataChart, IgrCategoryXAxis, IgrNumericYAxis, IgrLineSeries } from "igniteui-react-charts";
const AWS = require("aws-sdk");

const client = new AWS.DynamoDB.DocumentClient({
  region: "us-east-1",
  accessKeyId: "<MY AWS SERVER ACCESS KEY>",
  secretAccessKey: "<MY AWS SERVER SECRECT ACCESS KEY>",
});

function padWithZero(number) {
  return String(number).padStart(2, '0');
}

function App() {
  const [minValue, setMinValue] = useState(40);
  const [maxValue, setMaxValue] = useState(100);
  const [decibelValue, setDecibelValue] = useState(49);
  const [data, setData] = useState([]);

  var oneThird = (maxValue - minValue) / 3;

  useEffect(() => {
    const fetch_current_decible_value = setInterval(() => {
      fetchCurrentDecibleValue().then(async(decibelValue) => {
        setDecibelValue(decibelValue);
      });
    }, 1000);
    const fetch_five_min_decible_value = setInterval(() => {
      fetchLastFiveMinDecibleValues().then((results) => {
        var total_data = []
        results.forEach((items) => {
          var count = 0, sum = 0;
          var time = "";
          items.forEach((item) => {
            count++;
            sum += parseInt(item['db']);
            time = item['time'];
          });
          var temp_data = {}
          temp_data['time'] = time;
          temp_data['db'] = Math.floor(sum / count);

          total_data.push(temp_data);
        });
        
        total_data.reverse()
        setData(total_data);
      });
    }, 5000);
  }, []);

  const fetchCurrentDecibleValue = async () => {
    let date = new Date(Date.now());

    var pkey = date.getUTCFullYear() + "-" +
            padWithZero(date.getUTCMonth() + 1) + "-" +
            padWithZero(date.getUTCDate()) + "::" +
            padWithZero(date.getUTCHours()) + ":" +
            padWithZero(date.getUTCMinutes());
  
    var skey = padWithZero(date.getUTCSeconds());
  
    const params = {
      TableName: 'iot_project',
      KeyConditionExpression: '#pk = :partitionKeyValue AND #sk = :sortKeyValue',
      ExpressionAttributeNames: {
        '#pk': 'date',
        '#sk': 'time'
      },
      ExpressionAttributeValues: {
        ':partitionKeyValue': pkey,
        ':sortKeyValue': skey
      }
    };

    try {
      const result = await client.query(params).promise();
      return result.Items[0]['db'];
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchLastFiveMinDecibleValues = async () => {
    console.log("Last 5 min Data");
    let date = new Date(Date.now());

    var key = date.getUTCFullYear() + "-" +
            padWithZero(date.getUTCMonth() + 1) + "-" +
            padWithZero(date.getUTCDate()) + "::" +
            padWithZero(date.getUTCHours()) + ":";
    var pkey1 = key + padWithZero(date.getUTCMinutes() - 1);
    var pkey2 = key + padWithZero(date.getUTCMinutes() - 2);
    var pkey3 = key + padWithZero(date.getUTCMinutes() - 3);
    var pkey4 = key + padWithZero(date.getUTCMinutes() - 4);
    var pkey5 = key + padWithZero(date.getUTCMinutes() - 5);

    const param1 = {
      TableName: 'iot_project',
      KeyConditionExpression: '#pk = :partitionKeyValue',
      ExpressionAttributeNames: {
        '#pk': 'date'
      },
      ExpressionAttributeValues: {
        ':partitionKeyValue': pkey1
      }
    };
    const param2 = {
      TableName: 'iot_project',
      KeyConditionExpression: '#pk = :partitionKeyValue',
      ExpressionAttributeNames: {
        '#pk': 'date'
      },
      ExpressionAttributeValues: {
        ':partitionKeyValue': pkey2
      }
    };const param3 = {
      TableName: 'iot_project',
      KeyConditionExpression: '#pk = :partitionKeyValue',
      ExpressionAttributeNames: {
        '#pk': 'date'
      },
      ExpressionAttributeValues: {
        ':partitionKeyValue': pkey3
      }
    };const param4 = {
      TableName: 'iot_project',
      KeyConditionExpression: '#pk = :partitionKeyValue',
      ExpressionAttributeNames: {
        '#pk': 'date'
      },
      ExpressionAttributeValues: {
        ':partitionKeyValue': pkey4
      }
    };const param5 = {
      TableName: 'iot_project',
      KeyConditionExpression: '#pk = :partitionKeyValue',
      ExpressionAttributeNames: {
        '#pk': 'date'
      },
      ExpressionAttributeValues: {
        ':partitionKeyValue': pkey5
      }
    };
    const result1 = await client.query(param1).promise();
    const result2 = await client.query(param2).promise();
    const result3 = await client.query(param3).promise();
    const result4 = await client.query(param4).promise();
    const result5 = await client.query(param5).promise();
    return [result1.Items, result2.Items, result3.Items, result4.Items, result5.Items];
  }

  return (
    <div>
      <h1 className="center-heading">IOT Noise Monitoring Dashboard</h1>
      <div className="container horizontal-layout">
        <div className="container fill">
          <IgrDataChart width="700px" height="500px" dataSource={data}>
            <IgrCategoryXAxis name="xAxis" label="time" />
            <IgrNumericYAxis name="yAxis" />
            <IgrLineSeries
              name="noise"
              xAxisName="xAxis"
              yAxisName="yAxis"
              valueMemberPath="db"
            />
          </IgrDataChart>
        </div>

        <div className="container speedometer">
          <ReactSpeedometer
            minValue={minValue}
            maxValue={maxValue}
            value={decibelValue}
            needleColor="black"
            segmentColors={["#98FB98", "#FDFD96", "#D9544D"]}
            customSegmentStops={[
              minValue,
              Math.floor(minValue + oneThird),
              Math.floor(minValue + oneThird * 2),
              maxValue,
            ]}
            currentValueText="Decibel"
          />

          <h3>Reading Decibel Value: {decibelValue}</h3>
        </div>
      </div>
    </div>
  );
}

export default App;