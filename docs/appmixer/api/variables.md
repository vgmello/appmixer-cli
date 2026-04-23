# Variables

## Get flow variables

<mark style="color:green;">`POST`</mark> `/variables/:flowId/fetch`

Get variables.  Variables are placeholders that can be used in component config or inputs. These placeholders are replaced either at runtime by data coming from components connected back in the chain (dynamic variables) or by real values (static variables).

**Headers**

| Name          | Value              |
| ------------- | ------------------ |
| Content-Type  | `application/json` |
| Authorization | `Bearer <token>`   |

**Body**

| Name                  | Type           | Description                                                                                                     |
| --------------------- | -------------- | --------------------------------------------------------------------------------------------------------------- |
| useCache              | boolean        | Default `true`.                                                                                                 |
| flow                  | boolean        | Default `true`. If `true`, the response object will contain flow variables, too.                                |
| components            | object         |                                                                                                                 |
| components.IDs        | array\<string> | Array of component IDs                                                                                          |
| components.links      | boolean        | Default `true`. If `true`, the response object will contain *input link* variables for the given component IDs. |
| components.properties | boolean        | Default `true`. If true, the response object will contains *properties* variables for the given component IDs.  |

**Response**

{% tabs %}
{% tab title="200" %}

```json
{
    "components": {
        "e58aba53-cc20-4847-b3ef-c0d35d5e4421": {
            "links": {
                "message": {
                    "a6bb7a84-89c5-41e9-8b59-6a3264a49272": {
                        "out": {
                            "inspector": {},
                            "variables": {
                                "static": {},
                                "dynamic": [
                                    {
                                        "componentId": "9f9542a2-b37d-4280-aa54-87f21912701b",
                                        "hardwired": true,
                                        "label": "Start time",
                                        "port": "out",
                                        "value": "{{{$.9f9542a2-b37d-4280-aa54-87f21912701b.out.started}}}"
                                    },
                                    {
                                        "componentId": "9f9542a2-b37d-4280-aa54-87f21912701b",
                                        "hardwired": true,
                                        "label": "Raw Output",
                                        "port": "out",
                                        "value": "{{{$.9f9542a2-b37d-4280-aa54-87f21912701b.out}}}"
                                    },
                                    {
                                        "componentId": "a6bb7a84-89c5-41e9-8b59-6a3264a49272",
                                        "hardwired": true,
                                        "label": "Raw Output",
                                        "port": "out",
                                        "value": "{{{$.a6bb7a84-89c5-41e9-8b59-6a3264a49272.out}}}"
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            "properties": {
                "inspector": {
                    "inputs": {},
                    "groups": {},
                    "errors": {
                        "inputs": []
                    }
                },
                "variables": {
                    "static": {
                        "channelId": [
                            {
                                "label": "My Channel",
                                "value": "123"
                            },
                            {
                                "label": "Another Channel",
                                "value": "ABD1"
                            }
                        ]
                    }
                },
                "schema": {}
            }
        }
    },
    "flow": [
        {
            "label": "Flow ID",
            "category": [
                "Control"
            ],
            "name": "g_flowId"
        },
        {
            "label": "Flow Name",
            "category": [
                "Control"
            ],
            "name": "g_flowName"
        },
        {
            "label": "Random Number",
            "category": [
                "Math"
            ],
            "name": "g_random"
        },
        {
            "label": "PI",
            "category": [
                "Math"
            ],
            "name": "g_pi"
        },
        {
            "label": "UUID v4",
            "category": [
                "Control"
            ],
            "name": "g_uuid4"
        },
        {
            "label": "Timestamp (Unix)",
            "category": [
                "Date"
            ],
            "name": "g_timestamp"
        },
        {
            "label": "Now (ISO 8601)",
            "category": [
                "Date"
            ],
            "name": "g_now"
        },
        {
            "label": "User ID",
            "category": [
                "Control"
            ],
            "name": "g_userId"
        },
        {
            "label": "Webhook URL",
            "category": [
                "Control"
            ],
            "name": "g_webhookUrl"
        },
        {
            "label": "Custom Fields",
            "category": [
                "Control"
            ],
            "name": "g_customFields"
        }
    ]
}
```

{% endtab %}
{% endtabs %}

#### Example:

`curl --location 'https://api.YOUR_TENANT.appmixer.cloud/variables/bfc64735-7cf0-4061-844c-e15a7147cbc7/fetch'`\
`--header 'Authorization: Bearer [ACCESS_TOKEN]'`\
`--header 'Content-Type: application/json'`\
`--data '{ "useCache": true, "flow": false, "components": { "IDs": [ "bd9891a7-3303-43d4-a223-714a8db11e05" ], "properties": true, "links": false } }'`\ <br>


---

# Agent Instructions: Querying This Documentation

If you need additional information that is not directly available in this page, you can query the documentation dynamically by asking a question.

Perform an HTTP GET request on the current page URL with the `ask` query parameter:

```
GET https://docs.appmixer.com/api/variables.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
