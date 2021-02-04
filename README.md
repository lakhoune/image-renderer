#Image Renderer

Simple tool to render json data as google charts. 

##Start the server 
Make sure ``nodejs`` is installed. Run ``npm install`` in the root directory.
Now run `npm run watch` to start the server. The console should indicate the url on which the server is running (Default should be `http://localhost:3000`)

###Test the service
Open the browser and navigate to the url indicited in the console. The browser should show a sample chart

###Make your own requests
Make a post request to the root url. The body should contain at least the following 
* ``data``: This attribute should contain the data which should be visualized as a ``json array`` (or string of json array). Each ``json`` object represents a data point of the chart. The first property of the object designates the label of that data point and should therefore be of type ``string``
* ``chartType``: This property should contain the type of Google chart that should be displayed (Pay attention to case sensitivity). If omitted, the chart will be rendered as a `Piechart` 
* `options`: Holds optional drawing instructions. For more on this see the  [official Google Charts documentation](https://developers.google.com/chart/interactive/docs/customizing_charts)