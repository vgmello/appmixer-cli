# Unprocessed Messages

## Get messages

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/unprocessed-messages`

Get the list of the unprocessed messages for the current user.

#### Path Parameters

| Name | Type   | Description |
| ---- | ------ | ----------- |
|      | string |             |

{% tabs %}
{% tab title="200 " %}

```
[
    {
        "messageId": "a9b78d3c-ec9a-4c0e-81c2-b1df12bd46d7",
        "flowId": "796d7b5c-bea0-4594-a9df-a8a0e3c4616e",
        "componentId": "fdb29d7b-c6b7-423b-adb2-87b41289e925",
        "messages": {
            "in": [
                {
                    "properties": {
                        "correlationId": "0dcb7b2a-5933-481a-bb9c-c08a865656c0",
                        "gridInstanceId": null,
                        "contentType": "application/json",
                        "contentEncoding": "utf8",
                        "sender": {
                            "componentId": "3961d498-83f8-4714-85ba-0539d3055892",
                            "type": "appmixer.utils.controls.OnStart",
                            "outputPort": "out"
                        },
                        "destination": {
                            "componentId": "fdb29d7b-c6b7-423b-adb2-87b41289e925",
                            "inputPort": "in"
                        },
                        "correlationInPort": null,
                        "componentHeaders": {},
                        "flowId": "796d7b5c-bea0-4594-a9df-a8a0e3c4616e",
                        "messageId": "12374d7e-5c66-40d1-8772-37c424bd4182",
                        "flowRunId": 1603726768950
                    },
                    "content": {
                        "key": "hello"
                    },
                    "scope": {
                        "3961d498-83f8-4714-85ba-0539d3055892": {
                            "out": {
                                "started": "2020-10-26T15:39:29.003Z"
                            }
                        }
                    },
                    "originalContent": {
                        "started": "2020-10-26T15:39:29.003Z"
                    }
                }
            ]
        },
        "created": "2020-10-26T15:39:29.097Z",
        "err": //Stringyfied error object...
    }
]
```

{% endtab %}
{% endtabs %}

## Get message

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/unprocessed-messages/:messageId`

Get a single message.

#### Path Parameters

| Name      | Type   | Description |
| --------- | ------ | ----------- |
| messageId | string |             |

{% tabs %}
{% tab title="200 " %}

```
{
        "messageId": "a9b78d3c-ec9a-4c0e-81c2-b1df12bd46d7",
        "flowId": "796d7b5c-bea0-4594-a9df-a8a0e3c4616e",
        "componentId": "fdb29d7b-c6b7-423b-adb2-87b41289e925",
        "messages": {
            "in": [
                {
                    "properties": {
                        "correlationId": "0dcb7b2a-5933-481a-bb9c-c08a865656c0",
                        "gridInstanceId": null,
                        "contentType": "application/json",
                        "contentEncoding": "utf8",
                        "sender": {
                            "componentId": "3961d498-83f8-4714-85ba-0539d3055892",
                            "type": "appmixer.utils.controls.OnStart",
                            "outputPort": "out"
                        },
                        "destination": {
                            "componentId": "fdb29d7b-c6b7-423b-adb2-87b41289e925",
                            "inputPort": "in"
                        },
                        "correlationInPort": null,
                        "componentHeaders": {},
                        "flowId": "796d7b5c-bea0-4594-a9df-a8a0e3c4616e",
                        "messageId": "12374d7e-5c66-40d1-8772-37c424bd4182",
                        "flowRunId": 1603726768950
                    },
                    "content": {
                        "key": "hello"
                    },
                    "scope": {
                        "3961d498-83f8-4714-85ba-0539d3055892": {
                            "out": {
                                "started": "2020-10-26T15:39:29.003Z"
                            }
                        }
                    },
                    "originalContent": {
                        "started": "2020-10-26T15:39:29.003Z"
                    }
                }
            ]
        },
        "created": "2020-10-26T15:39:29.097Z",
        "err": //Stringyfied error object...
    }
```

{% endtab %}
{% endtabs %}

<mark style="color:red;">`DELETE`</mark> `https://api.YOUR_TENANT.appmixer.cloud/unprocessed-messages/:messageId`

Delete a message.

#### Path Parameters

| Name      | Type   | Description |
| --------- | ------ | ----------- |
| messageId | string |             |

{% tabs %}
{% tab title="200 " %}

```
{}
```

{% endtab %}
{% endtabs %}

## Retry a message

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/unprocessed-messages/:messageId`

Put the message back into Appmixer engine.&#x20;

#### Path Parameters

| Name      | Type   | Description |
| --------- | ------ | ----------- |
| messageId | string |             |

{% tabs %}
{% tab title="200 " %}

```
{}
```

{% endtab %}
{% endtabs %}


---

# Agent Instructions: Querying This Documentation

If you need additional information that is not directly available in this page, you can query the documentation dynamically by asking a question.

Perform an HTTP GET request on the current page URL with the `ask` query parameter:

```
GET https://docs.appmixer.com/api/unprocessed-messages.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
