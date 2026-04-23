# Charts

## Create Chart

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/charts`

This method is not meant to be implemented by applications embedding Appmixer SDK. Creating chart requires complex objects (options, query, traces), their structure goes beyond this documentation. `appmixer.ui.InsightsChartEditor` SDK component should be used to build Charts.

#### Request Body

| Name    | Type   | Description                                                                                      |
| ------- | ------ | ------------------------------------------------------------------------------------------------ |
| traces  | object | The aggregations that are represented on the chart along with their sources (flows, components). |
| query   | object | Object representing time range for the chart.                                                    |
| options | object | Object with the visualization options for the chart.                                             |
| index   | number | The position of the chart in the dashboard.                                                      |
| type    | string | Type of the chart. `bar, line, scatter, area, pie`                                               |
| name    | string | Name of the chart.                                                                               |

{% tabs %}
{% tab title="200 " %}

```
{
    chartId: '5defb3901f17d98d974fbb00'
}
```

{% endtab %}
{% endtabs %}

```javascript
{
    "name":"Test create chart",
    "index":1,
    "type":"bar",
    "options":{
        "layout":{
            "showlegend":true,
            "xaxis":{
                "showline":true
            },
            "yaxis":{
                "showline":false
            },
            "barmode":"group",
            "bargap":0.2,
            "bargroupgap":0.1
        },
        "showgrid":true,
        "showticklabels":true,
        "horizontal":false
    },
    "query":{
        "range":{
            "from":{
                "endOf":null,
                "startOf":"day",
                "subtract":[7,"day"]
            },
            "to":{}
        }
    },
    "traces":{
        "2f985875-4149-4c7b-a4ab-e204269c0c0f":{
            "name":"Trace 1",
            "hidden":false,
            "agg":{
                "date_histogram":{
                    "interval":"1d",
                    "min_doc_count":"0",
                    "field":"@timestamp"
                }
            },
            "options":{
                "type":"bar",
                "linewidth":0,
                "opacity":1
            },
            "source":{
                "type":"flow",
                "targets":{
                    "dbd206a4-23b3-44a4-a6c4-59db74aa3fb5":[]
                }
            }
        }
    }
}
```

## Update Chart

<mark style="color:orange;">`PUT`</mark> `https://api.YOUR_TENANT.appmixer.cloud/charts/:chartId`

The same properties as in Create Chart API endpoint.

#### Path Parameters

| Name | Type   | Description |
| ---- | ------ | ----------- |
|      | string |             |

{% tabs %}
{% tab title="200 " %}

```
{
    chartId: "5defa30cbd1ca06288202346"
    index: 1
    mtime: "2019-12-10T13:52:12.288Z"
    name: "Updated Chart"
    options: {,…}
    query: {,…}
    traces: {,…}
    type: "bar"
    userId: "5dee76c19462fe6b3fd42d79"   
}
```

{% endtab %}
{% endtabs %}

## Get Charts

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/charts`

Get a list of all charts the user has configured in their Insights Dashboard.

#### Query Parameters

| Name       | Type   | Description                                                                                                                          |
| ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| pattern    | string | Regex that will be used to match `name` property.                                                                                    |
| limit      | number | Maximum items returned. Default is 100. Used for paging.                                                                             |
| offset     | number | The index of the first item returned. Default is 0. Used for  for paging.                                                            |
| sort       | string | Sorting parameter. Can be any chart object property followed by semicolon and 1 (ascending) or -1 (descending). Example: "mtime:-1". |
| projection | string | Exclude chart object properties. Example: "-traces".                                                                                 |

{% tabs %}
{% tab title="200 Charts successfully retrieved." %}

```
[
    {
        "chartId": "5defa30cbd1ca06288202346",
        "userId": "5dee76c19462fe6b3fd42d79",
        "name": Chart 1",
        "index": 0,
        "type": "bar",
        "query": { ... },
        "options": { ... },
        "traces": { ... },
        "mtime": "2019-12-10T13:52:12.288Z"
    },
    {
        "chartId": "5defa30cbd1ca06288202347",
        "userId": "5dee76c19462fe6b3fd42d79",
        "name": Chart 2",
        "index": 0,
        "type": "bar",
        "query": { ... },
        "options": { ... },
        "traces": { ... },
        "mtime": "2019-13-10T13:52:12.288Z"
    }
]
```

{% endtab %}
{% endtabs %}

## Get One Chart

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/charts/:id`

#### Path Parameters

| Name | Type   | Description                |
| ---- | ------ | -------------------------- |
| id   | string | ID of the chart to return. |

{% tabs %}
{% tab title="200 " %}

```
{
        "chartId": "5defa30cbd1ca06288202346",
        "userId": "5dee76c19462fe6b3fd42d79",
        "name": Chart 1",
        "index": 0,
        "type": "bar",
        "query": { ... },
        "options": { ... },
        "traces": { ... },
        "mtime": "2019-12-10T13:52:12.288Z"
}
```

{% endtab %}
{% endtabs %}

## Delete a Chart

<mark style="color:red;">`DELETE`</mark> `https://api.YOUR_TENANT.appmixer.cloud/charts/:id`

#### Path Parameters

| Name | Type   | Description    |
| ---- | ------ | -------------- |
| id   | string | ID of a chart. |

{% tabs %}
{% tab title="200 " %}

```
```

{% endtab %}
{% endtabs %}


---

# Agent Instructions: Querying This Documentation

If you need additional information that is not directly available in this page, you can query the documentation dynamically by asking a question.

Perform an HTTP GET request on the current page URL with the `ask` query parameter:

```
GET https://docs.appmixer.com/api/charts.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
