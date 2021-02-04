const GoogleChartsNode = require('google-charts-node');

const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
app.use(bodyParser.json());

app.get('/', async (req, res) => {
  // Render the chart to image
  const image = await GoogleChartsNode.render(drawChart);
  res.header('Content-Type', 'image/png');
  res.send(image);
});

app.post('/', async (req, res) => {
  console.log(req.body);

  let data = req.body.data;
  if (typeof data == 'string') {
    data = JSON.parse(data);
  }
  // console.log(data);
  const drawchartString = formatChartString(data, req.body.chartType, req.body.options);
  // console.log(drawchartString);
  await GoogleChartsNode.render(drawchartString)
    .then((image) => {
      // console.log(image.buffer);
      // res.header('Content-Type', 'image/png');
      // res.send(image);
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': image.length,
      });
      res.end(image);
    })
    .catch((err) => {
      console.error(err);
      res.status(400).send(err);
    });
});

app.post('/customQuery', async (req, res) => {
  console.log(req.body);
  if (req.body.customQuery) {
    let data = req.body.customQuery;
    if (typeof data == 'string') {
      data = JSON.parse(data);
    }
    // console.log(data);
    const drawchartString = formatChartString(data, req.body.chartType, req.body.options);
    // console.log(drawchartString);
    await GoogleChartsNode.render(drawchartString)
      .then((image) => {
        // console.log(image.buffer);
        // res.header('Content-Type', 'image/png');
        // res.send(image);
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': image.length,
        });
        res.end(image);
      })
      .catch((err) => {
        console.error(err);
        res.status(400).send(err);
      });
  } else {
    console.log('wrong type');
    res.status(400).send('This type of query is not currently supported. ');
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

function drawChart() {
  let options = {
    title: 'Sample Chart: Average stars',
    vAxis: { title: 'Average stars' },
    height: 600,
    width: 700,
  };
  let data = google.visualization.arrayToDataTable([
    ['author', 'stars'],
    ['alice', 3.75],
    ['bob', 5.0],
    ['charly', 3.5],
    ['ben', 4.3333],
    ['aaron', 1.0],
  ]);

  let chart = new google.visualization.ColumnChart(container);
  chart.draw(data, options);
}

function formatChartString(query, chartType, options) {
  if (!chartType) {
    chartType = 'PieChart';
  }
  if (options) {
    options = JSON.stringify(options);
  } else {
    options = '{}';
  }
  let s1 = '';

  for (const key of Object.keys(query[0])) {
    //Sometimes the values inside the query are represented as a string even though they might be a number in reality
    if (isActuallyANumber(query[0][key])) {
      s1 += `data.addColumn('number', '${key}');`;
    } else {
      s1 += `data.addColumn('${typeof query[0][key]}', '${key}');`;
    }
  }

  let s2 = `data.addRows([`;
  for (const object of query) {
    //Sometimes the values inside the query are represented as a string even though they might be a number in reality
    let arr = Object.values(object).map((val) => (isActuallyANumber(val) ? Number(val) : val));
    s2 += `${JSON.stringify(arr)},`;
  }
  s2 += ']);';

  let result = `
  var data = new google.visualization.DataTable();
  ${s1}
  ${s2}
  // Set chart options
  var options = ${options};
  // Instantiate and draw our chart, passing in some options.
  var chart = new google.visualization.${chartType}(document.getElementById('chart_div'));
  chart.draw(data, options);`;

  //   console.log(result);
  return result;
}

function isActuallyANumber(n) {
  return typeof n == 'number' || !isNaN(Number(n));
}
