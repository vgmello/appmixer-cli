# Insights

## Get Logs and Histogram

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/logs`

Get logs for a single flow or list of flows or all user's flows. Filtering and sorting supported. Logs contain data messages getting into the component's input port(s) and messages sent to the component's output port(s). They also contain any errors that occurred during the flow run or while trying to start/stop a flow.\
\
`curl "https://api.appmixer.com/logs?from=0&size=30&sort=gridTimestamp:desc&query=gridTimestamp:[2019-03-04+TO+2019-03-08]&flowId=9c4673d7-a550-45a2-91c1-ad057fac0385" -H "Authorization: Bearer [ACCESS_TOKEN]"`\
\
`curl "https://api.appmixer.com/logs?from=0&size=30&sort=gridTimestamp:desc&query=gridTimestamp:[2019-03-04+TO+2019-03-08]" -H "Authorization: Bearer [ACCESS_TOKEN]"`

Example with the `searchAfter`:

`https://api.appmixer.com/logs?flowId=9c4673d7-a550-45a2-91c1-ad057fac0385&size=30&sort=gridTimestamp:asc&sort=_id:asc&query=gridTimestamp:[* TO *]&searchAfter=2023-10-25T15:03:17.721Z&searchAfter=wC5cZ4sB5dpG2lX0gmxi`

The second value in the `searchAfter` is the \_id of a log record.

#### Query Parameters

| Name        | Type   | Description                                                                                                                                                                                                                                                                                                                             |
| ----------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| portType    | string | string: `in` or `out` . Or it can be array `portType=in&portType=out`. Used to filter only input messages or output messages. `in and out` by default.                                                                                                                                                                                  |
| flowId      | string | The flow ID to filter on. This parameter can be used multiple times to filter on more flows. If not present, it will return logs for all user's flows (even flows that are being shared with signed in user).                                                                                                                           |
| excludes    | string | A comma separated field names to exclude from the log objects returned.                                                                                                                                                                                                                                                                 |
| includes    | string | A comma separated field names to include from the log objects returned.                                                                                                                                                                                                                                                                 |
| query       | string | Query string. Uses the Lucene query syntax: <https://lucene.apache.org/core/2\\_9\\_4/queryparsersyntax.html>                                                                                                                                                                                                                           |
| sort        | string | A parameter to sort the result. Optionally followed by ":desc" to change the order. `asc` by default. This parameter can be passed multiple times to use multiple sortings.                                                                                                                                                             |
| size        | number | Maximum number of logs returned. Useful for pagination. 50 records by default.                                                                                                                                                                                                                                                          |
| from        | number | Index of the first log returned. Useful for pagination.                                                                                                                                                                                                                                                                                 |
| searchAfter | string | If using a sort parameter, this parameter can be used to specify from what value the logs will be fetch. Very useful for pagination and much more efficient than using `from` parameter for this purpose. Can be passed multiple times if you are using a secondary sorting. This is usually to ensure that no duplicates are returned. |

{% tabs %}
{% tab title="200 " %}

```javascript
{
  "buckets": [
   {
     "key_as_string": "2018-04-16T00:00:00.000Z",
     "key": 1523836800000,
     "doc_count": 35
   },
   {
     "key_as_string": "2018-04-17T00:00:00.000Z",
     "key": 1523923200000,
     "doc_count": 60
   }
  ],
  "hits": [
    {
      "severity": "info",
      "componentType": "appmixer.slack.list.SendChannelMessage",
      "componentId": "a1cda3ff-8e20-41df-8e7d-8e52419e6d17",
      "portType": "in",
      "senderId": "c062e744-2de1-4c80-afce-713be3145315",
      "@timestamp": "2018-04-06T14:02:04.517Z",
      "port": "message",
      "senderType": "appmixer.utils.controls.OnStart",
      "correlationId": "a5128135-3a23-4837-92f8-9dc099ff0700",
      "id": "339d216c-48e0-4110-9210-a4c176b30f84:a1cda3ff-8e20-41df-8e7d-8e52419e6d17:input-queue",
      "gridTimestamp": "2018-04-06T14:02:04.472Z",
      "flowId": "339d216c-48e0-4110-9210-a4c176b30f84",
      "entity": "input-queue",
      "_id": "AWKbQ6Vr9I6rzDWu4NbG",
      "_index": "appmixer-201804"
    },
    {
      "severity": "info",
      "componentType": "appmixer.slack.list.SendChannelMessage",
      "componentId": "a1cda3ff-8e20-41df-8e7d-8e52419e6d17",
      "portType": "in",
      "senderId": "c062e744-2de1-4c80-afce-713be3145315",
      "@timestamp": "2018-04-03T20:22:10.971Z",
      "port": "message",
      "senderType": "appmixer.utils.controls.OnStart",
      "correlationId": "7ed0bbb4-0b05-4469-8168-401cd909e5d2",
      "id": "339d216c-48e0-4110-9210-a4c176b30f84:a1cda3ff-8e20-41df-8e7d-8e52419e6d17:input-queue",
      "gridTimestamp": "2018-04-03T20:22:10.927Z",
      "flowId": "339d216c-48e0-4110-9210-a4c176b30f84",
      "entity": "input-queue",
      "_id": "AWKNLJEg9I6rzDWu3F8E",
      "_index": "appmixer-201804"
    }
  ]
}
```

{% endtab %}
{% endtabs %}

## Get Log Detail

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/log/:logIndex/:logId`

DEPRECATED. You can get the log details with /logs API:

`curl "https://api.appmixer.com/logs?query=_id:AWKbQ6Vr9I6rzDWu4NbG&sort=@timestamp:desc" -H "Authorization: Bearer [ACCESS_TOKEN]"`

Get a detail of a log. Log detail gives you information on the actual data of the message between two components.\
\
`curl "https://api.appmixer.com/log/93198d48-e680-49bb-855c-58c2c11d1857/appmixer-201804/AWKbQ6Vr9I6rzDWu4NbG" -H "Authorization: Bearer [ACCESS_TOKEN]"`

#### Path Parameters

| Name     | Type   | Description                                                                      |
| -------- | ------ | -------------------------------------------------------------------------------- |
| logId    | string | Log ID. Use the "\_id" property of the log object returned from flow logs.       |
| logIndex | string | Log index. Use the "\_index" property of the log object returned from flow logs. |

{% tabs %}
{% tab title="200 " %}

```javascript
{
  "_index": "appmixer-201804",
  "_type": "engine",
  "_id": "AWKbQ6Vr9I6rzDWu4NbG",
  "_version": 1,
  "_source": {
    "severity": "info",
    "msg": {
      "text": "Hey Slack!"
    },
    "componentType": "appmixer.slack.list.SendChannelMessage",
    "componentId": "a1cda3ff-8e20-41df-8e7d-8e52419e6d17",
    "bundleId": "86a83327-1b13-4cab-a7cd-bbcce5f2402d",
    "portType": "in",
    "senderId": "c062e744-2de1-4c80-afce-713be3145315",
    "@timestamp": "2018-04-06T14:02:04.517Z",
    "port": "message",
    "@version": "1",
    "senderType": "appmixer.utils.controls.OnStart",
    "correlationId": "a5128135-3a23-4837-92f8-9dc099ff0700",
    "id": "339d216c-48e0-4110-9210-a4c176b30f84:a1cda3ff-8e20-41df-8e7d-8e52419e6d17:input-queue",
    "gridTimestamp": "2018-04-06T14:02:04.472Z",
    "flowId": "339d216c-48e0-4110-9210-a4c176b30f84"
  }
}
```

{% endtab %}
{% endtabs %}

## &#x20;Get Logs (Aggregations)

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/logs`

This method works the same as its /GET counterpart, but it also allows to get aggregations within the matched data, by passing a request body specifying desired aggregations.

#### Query Parameters

| Name          | Type   | Description                                                                                                                                                                                                                                                                                                                             |
| ------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| flowId        | string | The flow ID to filter on. This parameter can be used multiple times to filter on more flows.                                                                                                                                                                                                                                            |
| excludes      | string | A comma separated field names to exclude from the log objects returned.                                                                                                                                                                                                                                                                 |
| includes      | string | A comma separated field names to include from the log objects returned.                                                                                                                                                                                                                                                                 |
| query         | string | <p>Query string. Uses the Lucene query syntax: <https://lucene.apache.org/core/2_9_4/queryparsersyntax.html><br></p>                                                                                                                                                                                                                    |
| sort          | string | A parameter to sort the result. Optionally followed by ":desc" to change the order. `asc` by default. This parameter can be passed multiple times to use multiple sortings.                                                                                                                                                             |
| size          | number | Maximum number of logs returned. Useful for pagination.                                                                                                                                                                                                                                                                                 |
| from          | number | Index of the first log returned. Useful for pagination.                                                                                                                                                                                                                                                                                 |
| search\_after | string | If using a sort parameter, this parameter can be used to specify from what value the logs will be fetch. Very useful for pagination and much more efficient than using `from` parameter for this purpose. Can be passed multiple times if you are using a secondary sorting. This is usually to ensure that no duplicates are returned. |

#### Request Body

| Name | Type   | Description                                                                                                                                                                                           |
| ---- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| aggs | object | <p>An object describing the desired aggregations. Uses Elasticsearch aggregation search structure: <https://elastic.co/guide/en/elasticsearch/reference/current/search-aggregations.html><br><br></p> |

{% tabs %}
{% tab title="200 This response is dynamic and its structure will depend on the body of the request as well. For example, aggregation names used on the request will be used in the response as well. It is also possible to query nested aggregations, leading to a more complex response as well." %}

```
{
    "aggregations": {
        "avg_price": {
            "value": 10
        },
        "sum_income": {
            "value": 2000
        }
    },
    "hits": [
        { "flowId": "78230318-37b8-40ac-97a5-996ba9a6c48f", ... },
        { "flowId": "78230318-37b8-40ac-97a5-996ba9a6c48f", ... },
        ...
    ]
}
```

{% endtab %}
{% endtabs %}

## Get Usage Information for Current User

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/telemetry`

Get usage information.\
\
`curl "https://api.appmixer.com/telemetry?from=2018-03-17&to=2018-04-17" -H "Authorization: Bearer [ACCESS_TOKEN]"`

#### Query Parameters

| Name | Type   | Description |
| ---- | ------ | ----------- |
| to   | string | To date.    |
| from | string | From date.  |

{% tabs %}
{% tab title="200 " %}

```javascript
{
  "messageCounts": {
    "from": "2018-03-17",
    "to": "2018-04-17",
    "count": 348,
    "userId": "58593f07c3ee4f239dc69ff7"
  },
  "runningFlows": {
    "userId": "58593f07c3ee4f239dc69ff7",
    "count": 4
  },
  "activeConnectors": {
    "userId": "58593f07c3ee4f239dc69ff7",
    "count": 8
  },
  "usedApps": [
    "appmixer.utils",
    "appmixer.slack",
    "appmixer.asana",
    "appmixer.salesforce",
    "appmixer.twilio"
  ]
}
```

{% endtab %}
{% endtabs %}

## Get Usage Information For Other Users

<mark style="color:blue;">`GET`</mark> `https://api.appmixer.com/telemetry/messages`

Get usage information for a user identified by the `userId` query parameter. This call requires admin privileges.\
\
`curl "https://api.appmixer.com/telemetry/messages?userId=54324413432141432&from=2024-01&to=2024-02 -H "Authorization: Bearer [ACCESS_TOKEN]"`

#### Query Parameters

| Name   | Type   | Description |
| ------ | ------ | ----------- |
| to     | string | To date.    |
| from   | string | From date.  |
| userId | string | A user ID.  |

{% tabs %}
{% tab title="200 " %}

```javascript
{
  "from": "2024-01-01",
  "to": "2024-02-01",
  "totalCount": 24,
  "totalSize": 8050,
  "stats": [
    {
      "size": 1772,
      "count": 4,
      "date": "2024-02"
    },
    {
      "size": 6278,
      "count": 20,
      "date": "2024-01"
    }
  ]
}
```

{% endtab %}
{% endtabs %}

## Get Flow Usage Information

<mark style="color:blue;">`GET`</mark> `https://api.appmixer.com/telemetry/flows/:flowId`

Get usage information for a flow identified by `flowId`. This call requires admin privileges. \
\
`curl "https://api.appmixer.com/telemetry/flows/ef4324-431ff-434fadf-424 -H "Authorization: Bearer [ACCESS_TOKEN]"`

{% tabs %}
{% tab title="200 " %}

```javascript
{
  "totalCount": 10,
  "totalSize": 9220
}
```

{% endtab %}
{% endtabs %}


---

# Agent Instructions: Querying This Documentation

If you need additional information that is not directly available in this page, you can query the documentation dynamically by asking a question.

Perform an HTTP GET request on the current page URL with the `ask` query parameter:

```
GET https://docs.appmixer.com/api/insights.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
