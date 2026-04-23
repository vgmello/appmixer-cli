# Flows

## Get Flows

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/flows`

Return all flows of a user.\
\
`curl "https://api.appmixer.com/flows" -H "Authorization: Bearer [ACCESS_TOKEN]"`

#### Query Parameters

| Name                  | Type   | Description                                                                                                                                                                                                                                                                                                                              |
| --------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| filter                | string | Filter flows by their property values. Example: "userId:123abc" returns only flows who's owner is the user with ID "123abc" (i.e. shared flows are excluded). Note that you can also search on nested fields. This is especially useful with the `customFields` metadata object. For example: "filter=customFields.category:healthcare". |
| sharedWithPermissions | string | Filter flows by their sharing setting. Example: "read,start". All possible permission are currently "read", "start", "stop".                                                                                                                                                                                                             |
| projection            | string | Exclude flow object properties. Example: "-flow,-thumbnail".                                                                                                                                                                                                                                                                             |
| sort                  | string | Sorting parameter. Can be any flow object property followed by semicolon and 1 (ascending), -1 (descending). Example: "mtime:-1".                                                                                                                                                                                                        |
| pattern               | string | A term to filter flows containing pattern in their *name* or *flowId* property.                                                                                                                                                                                                                                                          |
| offset                | number | The index of the first item returned. Default is 0. Useful for paging.                                                                                                                                                                                                                                                                   |
| limit                 | number | Maximum items returned. Default is 100. Useful for paging.                                                                                                                                                                                                                                                                               |

{% tabs %}
{% tab title="200 Flows successfully retrieved." %}

```javascript
[
  {
    "userId": "58593f07c3ee4f239dc69ff7",
    "flowId": "9089f275-f5a5-4796-ba23-365412c5666e",
    "stage": "stopped",
    "name": "Flow #4",
    "btime": "2018-03-29T19:24:08.950Z",
    "mtime": "2018-04-05T12:50:15.952Z",
    "sharedWith": [{
      "email": "david@client.io",
      "permissions": ["read", "start", "stop"]
    }],
    "flow": {
      "e15ef119-8fcb-459b-aaae-2a3f9ee41f15": {
        "type": "appmixer.utils.http.Uptime",
        "label": "Uptime",
        "source": {},
        "x": 110,
        "y": 90,
        "config": {}
      },
      "43f1f63a-ecd2-42dc-a618-8c96b4acc767": {
        "type": "appmixer.utils.email.SendEmail",
        "label": "SendEmail",
        "source": {
          "in": {
            "e15ef119-8fcb-459b-aaae-2a3f9ee41f15": [
              "up"
            ]
          }
        },
        "x": 320,
        "y": -10,
        "config": {
          "transform": {
            "in": {
              "e15ef119-8fcb-459b-aaae-2a3f9ee41f15": {
                "up": {
                  "type": "json2new",
                  "lambda": {
                    "from_email": "info@appmixer.com",
                    "text": "Site {{{$.e15ef119-8fcb-459b-aaae-2a3f9ee41f15.up.target}}} is back UP.\nDowntime: {{{$.e15ef119-8fcb-459b-aaae-2a3f9ee41f15.up.downTimeText}}}\nHTTP Status Code: {{{$.e15ef119-8fcb-459b-aaae-2a3f9ee41f15.up.statusCode}}}",
                    "subject": "Appmixer: Site UP ({{{$.e15ef119-8fcb-459b-aaae-2a3f9ee41f15.up.target}}})"
                  }
                }
              }
            }
          }
        }
      },
      "416150af-b0d4-4d06-8ad1-75b17e578532": {
        "type": "appmixer.utils.email.SendEmail",
        "label": "SendEmail",
        "source": {
          "in": {
            "e15ef119-8fcb-459b-aaae-2a3f9ee41f15": [
              "down"
            ]
          }
        },
        "x": 320,
        "y": 195,
        "config": {
          "transform": {
            "in": {
              "e15ef119-8fcb-459b-aaae-2a3f9ee41f15": {
                "down": {
                  "type": "json2new",
                  "lambda": {
                    "from_email": "info@appmixer.com",
                    "subject": "Appmixer: Site DOWN ({{{$.e15ef119-8fcb-459b-aaae-2a3f9ee41f15.down.target}}})",
                    "text": "Site {{{$.e15ef119-8fcb-459b-aaae-2a3f9ee41f15.down.target}}} is DOWN.\nHTTP Status Code: {{{$.e15ef119-8fcb-459b-aaae-2a3f9ee41f15.down.statusCode}}}"
                  }
                }
              }
            }
          }
        }
      }
    },
    "mode": "module",
    "thumbnail": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D...",
    "started": "2018-04-05T12:33:15.357Z"
  },
  {
    "userId": "58593f07c3ee4f239dc69ff7",
    "flowId": "93198d48-e680-49bb-855c-58c2c11d1857",
    "stage": "stopped",
    "name": "Flow #5",
    "btime": "2018-04-03T15:48:52.730Z",
    "mtime": "2018-04-11T07:41:22.767Z",
    "flow": {
      "ce0742f4-4f72-4ea2-bea6-62cfaa2def86": {
        "type": "appmixer.utils.email.SendEmail",
        "label": "SendEmail",
        "source": {
          "in": {
            "3d71d67f-df0b-4723-bf85-20c97f6eaff6": [
              "weather"
            ]
          }
        },
        "x": 485,
        "y": 95,
        "config": {
          "transform": {
            "in": {
              "3d71d67f-df0b-4723-bf85-20c97f6eaff6": {
                "weather": {
                  "type": "json2new",
                  "lambda": {
                    "from_email": "info@appmixer.com",
                    "subject": "Appmixer: Current Weather",
                    "text": "Temperature: {{{$.3d71d67f-df0b-4723-bf85-20c97f6eaff6.weather.main.temp}}} dgC\nPressure: {{{$.3d71d67f-df0b-4723-bf85-20c97f6eaff6.weather.main.pressure}}} hPa\nHumidity: {{{$.3d71d67f-df0b-4723-bf85-20c97f6eaff6.weather.main.humidity}}}%\nCloudiness: {{{$.3d71d67f-df0b-4723-bf85-20c97f6eaff6.weather.clouds.all}}}%",
                    "to": ""
                  }
                }
              }
            }
          }
        }
      },
      "3d71d67f-df0b-4723-bf85-20c97f6eaff6": {
        "type": "appmixer.utils.weather.GetCurrentWeather",
        "label": "GetCurrentWeather",
        "source": {
          "location": {
            "b4d1ddbc-4bed-4de3-8fe1-9d9542d03cf0": [
              "out"
            ]
          }
        },
        "x": 290,
        "y": 95,
        "config": {
          "transform": {
            "location": {
              "b4d1ddbc-4bed-4de3-8fe1-9d9542d03cf0": {
                "out": {
                  "type": "json2new",
                  "lambda": {
                    "city": "Prague",
                    "units": "metric"
                  }
                }
              }
            }
          }
        }
      },
      "b4d1ddbc-4bed-4de3-8fe1-9d9542d03cf0": {
        "type": "appmixer.utils.controls.OnStart",
        "label": "OnStart",
        "source": {},
        "x": 105,
        "y": 95,
        "config": {}
      }
    },
    "mode": "module",
    "thumbnail": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D...",
    "started": "2018-04-06T12:59:29.631Z"
  }
]
```

{% endtab %}
{% endtabs %}

## Get Flow

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/flows/:id`

Return one flow.\
\
`curl "https://api.appmixer.com/flows/9089f275-f5a5-4796-ba23-365412c5666e" -H "Authorization: Bearer [ACCESS_TOKEN]"`

#### Path Parameters

| Name | Type   | Description |
| ---- | ------ | ----------- |
| id   | string |             |

{% tabs %}
{% tab title="200 Flow successfully retrieved" %}

```javascript
{
  "userId": "58593f07c3ee4f239dc69ff7",
  "flowId": "9089f275-f5a5-4796-ba23-365412c5666e",
  "stage": "stopped",
  "name": "Flow #4",
  "btime": "2018-03-29T19:24:08.950Z",
  "mtime": "2018-04-05T12:50:15.952Z",
  "flow": {
    "e15ef119-8fcb-459b-aaae-2a3f9ee41f15": {
      "type": "appmixer.utils.http.Uptime",
      "label": "Uptime",
      "source": {},
      "x": 110,
      "y": 90,
      "config": {}
    },
    "43f1f63a-ecd2-42dc-a618-8c96b4acc767": {
      "type": "appmixer.utils.email.SendEmail",
      "label": "SendEmail",
      "source": {
        "in": {
          "e15ef119-8fcb-459b-aaae-2a3f9ee41f15": [
            "up"
          ]
        }
      },
      "x": 320,
      "y": -10,
      "config": {
        "transform": {
          "in": {
            "e15ef119-8fcb-459b-aaae-2a3f9ee41f15": {
              "up": {
                "type": "json2new",
                "lambda": {
                  "from_email": "info@appmixer.com",
                  "text": "Site {{{$.e15ef119-8fcb-459b-aaae-2a3f9ee41f15.up.target}}} is back UP.\nDowntime: {{{$.e15ef119-8fcb-459b-aaae-2a3f9ee41f15.up.downTimeText}}}\nHTTP Status Code: {{{$.e15ef119-8fcb-459b-aaae-2a3f9ee41f15.up.statusCode}}}",
                  "subject": "Appmixer: Site UP ({{{$.e15ef119-8fcb-459b-aaae-2a3f9ee41f15.up.target}}})"
                }
              }
            }
          }
        }
      }
    },
    "416150af-b0d4-4d06-8ad1-75b17e578532": {
      "type": "appmixer.utils.email.SendEmail",
      "label": "SendEmail",
      "source": {
        "in": {
          "e15ef119-8fcb-459b-aaae-2a3f9ee41f15": [
            "down"
          ]
        }
      },
      "x": 320,
      "y": 195,
      "config": {
        "transform": {
          "in": {
            "e15ef119-8fcb-459b-aaae-2a3f9ee41f15": {
              "down": {
                "type": "json2new",
                "lambda": {
                  "from_email": "info@appmixer.com",
                  "subject": "Appmixer: Site DOWN ({{{$.e15ef119-8fcb-459b-aaae-2a3f9ee41f15.down.target}}})",
                  "text": "Site {{{$.e15ef119-8fcb-459b-aaae-2a3f9ee41f15.down.target}}} is DOWN.\nHTTP Status Code: {{{$.e15ef119-8fcb-459b-aaae-2a3f9ee41f15.down.statusCode}}}"
                }
              }
            }
          }
        }
      }
    }
  },
  "mode": "module",
  "thumbnail": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D...",
  "started": "2018-04-05T12:33:15.357Z"
}
```

{% endtab %}
{% endtabs %}

## Get Flows Count

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/flows/count`

Return the number of all flows of a user.\
\
`curl "https://api.appmixer.com/flows/count" -H "Authorization: Bearer [ACCESS_TOKEN]"`

{% tabs %}
{% tab title="200 " %}

```javascript
{
    "count": 29
}    
```

{% endtab %}
{% endtabs %}

## Create Flow

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/flows`

Create a new flow.\
\
`curl -XPOST "https://api.appmixer.com/flows" -H "Content-Type: application/json" -d '{ "flow": FLOW_DESCRIPTOR, "name": "My Flow #1", "customFields": { "category": "healthcare" } }'`

#### Request Body

| Name         | Type   | Description                                                                                                                                        |
| ------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| name         | string | Name of the flow.                                                                                                                                  |
| customFields | object | An object with any custom properties. This is useful for storing any custom metadata and later using the metadata values to filter returned flows. |
| thumbnail    | string | Flow thumbnail image.                                                                                                                              |
| flow         | object | Flow descriptor.                                                                                                                                   |

{% tabs %}
{% tab title="200 Flow successfully created." %}

```
{
    "flowId": "26544d8c-5209-44ac-9bdf-ef786924b07b"
}
```

{% endtab %}
{% endtabs %}

## Update Flow

<mark style="color:orange;">`PUT`</mark> `https://api.YOUR_TENANT.appmixer.cloud/flows/:id`

Update an existing flow.\
\
`curl -XPUT "https://api.appmixer.com/flows/9089f275-f5a5-4796-ba23-365412c5666e" -H "Content-Type: application/json" -d '{ "flow": FLOW_DESCRIPTOR, "name": "My Flow #2" }'`

#### Path Parameters

| Name | Type   | Description |
| ---- | ------ | ----------- |
| id   | string | Flow ID.    |

#### Query Parameters

<table><thead><tr><th width="201">Name</th><th width="147">Type</th><th>Description</th></tr></thead><tbody><tr><td>forceUpdate</td><td>boolean</td><td>A running flow cannot be updated unless forceUpdate=true.</td></tr></tbody></table>

#### Request Body

| Name | Type   | Description                                                                                                              |
| ---- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
|      | object | An object with `flow`, `name` , `customFields` , `thumbnail` and `sharedWith` parameters. `flow` is the Flow descriptor. |

{% tabs %}
{% tab title="200 " %}

```
{
    "flowId": "26544d8c-5209-44ac-9bdf-ef786924b07b",
    "result": "updated"
}
```

{% endtab %}
{% endtabs %}

## Delete Flow

<mark style="color:red;">`DELETE`</mark> `https://api.YOUR_TENANT.appmixer.cloud/flows/:id`

Delete an existing flow.\
\
`curl -XDELETE "https://api.appmixer.com/flows/9089f275-f5a5-4796-ba23-365412c5666e" -H "Authorization: Bearer [ACCESS_TOKEN]"`

#### Path Parameters

| Name | Type   | Description |
| ---- | ------ | ----------- |
| id   | string | Flow ID.    |

{% tabs %}
{% tab title="200 " %}

```
{
    "flowId": "26544d8c-5209-44ac-9bdf-ef786924b07b"
}
```

{% endtab %}
{% endtabs %}

## Clone Flow

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/flows/:id/clone`

Clone a flow

#### Path Parameters

| Name                                 | Type   | Description |
| ------------------------------------ | ------ | ----------- |
| id<mark style="color:red;">\*</mark> | String | Flow ID     |

#### Request Body

| Name               | Type    | Description                                                                                                                                                                                                                                                                               |
| ------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| prefix             | String  | Prefix for flow clone name. The original flow name will be used with this prefix as a name for the new flow.                                                                                                                                                                              |
| projection         | String  | <p>Properties to be filtered from the flow model. </p><p>Example: "-thumbnail,-sharedWith".  With this projection string, the thumbnail and sharedWith property will not be cloned.</p>                                                                                                   |
| connectAccounts    | Boolean | If user accounts (like Gmail account for SendEmail component) connected to the source flow components should also be connected to cloned flow components. Default is false. Accounts can be connected only if the owner of the cloned flow is the same as the owner of the original flow. |
| isTemplateInstance | Boolean | If source flow is an instance of template (related to Integrations). Default is false                                                                                                                                                                                                     |
| setOriginFlowId    | Boolean | Default false. If true, the originFlowId property of the clone will be set to the original flow.                                                                                                                                                                                          |
| setComponentIdMap  | Boolean | Default true. Stores a map of the component IDs from the original flow to the component IDs in the clone. This is later used in Integrations when performing updates of the Integration Templates.                                                                                        |
| additional         | Object  | `sharedWith`, `type` and `wizard` properties can be set in this object.                                                                                                                                                                                                                   |

{% tabs %}
{% tab title="200: OK " %}

```javascript
{
  "cloneId": "cloned-flow-id"
}
```

{% endtab %}
{% endtabs %}

## Start/Stop Flow

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/flows/:id/coordinator`

Start or stop an existing flow.\
\
`curl -XPOST "https://api.appmixer.com/flows/9089f275-f5a5-4796-ba23-365412c5666e" -H "Content-Type: application/json" -d '{ "command": "start" }'`

#### Path Parameters

| Name | Type   | Description |
| ---- | ------ | ----------- |
| id   | string | Flow ID.    |

#### Query Parameters (only for the stop command)

| Name       | Type    | Description                                                                                                                                                    |
| ---------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| background | boolean | Will trigger the stop command, but won't wait for it to finish. Then you can use GET /flows/{flowId}/coordinator/status to check the status of that operation. |

#### Request Body

| Name    | Type   | Description                                                                          |
| ------- | ------ | ------------------------------------------------------------------------------------ |
| command | string | The command to send to the flow coordinator. It can be either `"start"` or `"stop"`. |

{% tabs %}
{% tab title="200 " %}

```json
{
    "flowId": "26544d8c-5209-44ac-9bdf-ef786924b07b",
    // equals the flowId if the background=true is sent in the query
    "ticket": "26544d8c-5209-44ac-9bdf-ef786924b07b"  
}
```

{% endtab %}
{% endtabs %}

## Get the status of the stop flow command

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/flows/{flowId}/coordinator/status`

{% tabs %}
{% tab title="200 " %}

```json
{
    "status": "completed",
    "stepsTotal":1
}
```

{% endtab %}
{% endtabs %}

## Send GET request to a component

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/flows/:flowId/components/:componentId`

**Query Parameters**

| Name        | Type    | Description                                                                                                                                                                                                                                                             |
| ----------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| enqueueOnly | Boolean | If "true" then the response to this request will be returned as soon as the requests is enqueued in the engine. It will not wait for the component to process the request and create the response. The response code is 202 in this case. The default value is "false". |

{% tabs %}
{% tab title="200: OK " %}

```javascript
{
    // Response
}
```

{% endtab %}

{% tab title="202: Accepted If the component needs quota to process the webhook and it cannot get quota, Appmixer will return 202 and enqueue the incoming request for processing. It will be processed when quota is available." %}

```javascript
{
    // Response
}
```

{% endtab %}
{% endtabs %}

## Send POST request to a component

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/flows/:flowId/components/:componentId`

**Query Parameters**

| Name        | Type    | Description                                                                                                                                                                                                                                                             |
| ----------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| enqueueOnly | Boolean | If "true" then the response to this request will be returned as soon as the requests is enqueued in the engine. It will not wait for the component to process the request and create the response. The response code is 202 in this case. The default value is "false". |

{% tabs %}
{% tab title="200: OK " %}

```javascript
{
    // Response
}
```

{% endtab %}

{% tab title="202: Accepted If the component needs quota to process the webhook and it cannot get quota, Appmixer will return 202 and enqueue the incoming request for processing. It will be processed when quota is available." %}

```javascript
{
    // Response
}
```

{% endtab %}
{% endtabs %}

## Send PUT request to a component

<mark style="color:orange;">`PUT`</mark> `https://api.YOUR_TENANT.appmixer.cloud/flows/:flowId/components/:componentId`

**Query Parameters**

| Name        | Type    | Description                                                                                                                                                                                                                                                             |
| ----------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| enqueueOnly | Boolean | If "true" then the response to this request will be returned as soon as the requests is enqueued in the engine. It will not wait for the component to process the request and create the response. The response code is 202 in this case. The default value is "false". |

{% tabs %}
{% tab title="200: OK " %}

```javascript
{
    // Response
}
```

{% endtab %}

{% tab title="202: Accepted If the component needs quota to process the webhook and it cannot get quota, Appmixer will return 202 and enqueue the incoming request for processing. It will be processed when quota is available." %}

```javascript
{
    // Response
}
```

{% endtab %}
{% endtabs %}

### Send DELETE request to a component <a href="#send-delete-request-to-a-component" id="send-delete-request-to-a-component"></a>

<mark style="color:red;">`DELETE`</mark> `https://api.appmixer.com/flows/:flowId/components/:componentId`

**Query Parameters**

| Name        | Type    | Description                                                                                                                                                                                                                                                                           |
| ----------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| enqueueOnly | Boolean | <p>If "true" then the response to this request will be returned as soon as the requests is enqueued in the engine. It will not wait for the component to process the request and create the response. The response code is 202 in this case. The default value is </p><p>"false".</p> |


---

# Agent Instructions: Querying This Documentation

If you need additional information that is not directly available in this page, you can query the documentation dynamically by asking a question.

Perform an HTTP GET request on the current page URL with the `ask` query parameter:

```
GET https://docs.appmixer.com/api/flows.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
