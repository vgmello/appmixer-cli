# Config

## Get all configuration entries

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/config`

Only returns the values that have been stored by the user through the API

{% tabs %}
{% tab title="200: OK " %}

```javascript
[
  {
    "key": "JWTSecret",
    "value": "OQekJ3DH4pRnWFl4wlN0hzhc5UIjdihEwFnwYLYUdXGXk+/f5JieT/1VLPUJnvALIGK014md41rUuarqYZscl2T5azHQmFhQmUKj8dEuoIELWB45wlkxDKcojCQi9Otk76itnmvKrbm/ZokDJxePNv2Edgc7/mLrTHG7l54w44c="
  },
  {
    "key": "WEBHOOK_FLOW_COMPONENT_ERROR",
    "value": "https://example.com/webhook"
  }
]
```

{% endtab %}
{% endtabs %}

## Create a configuration key/value pair

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/config`

#### Request Body

| Name                                    | Type   | Description         |
| --------------------------------------- | ------ | ------------------- |
| key<mark style="color:red;">\*</mark>   | String | Configuration key   |
| value<mark style="color:red;">\*</mark> | Any    | Configuration value |

{% tabs %}
{% tab title="200: OK " %}

```javascript
{
  "key": "myConfigKey",
  "value": "My Custom Value"
}
```

{% endtab %}
{% endtabs %}

## Removes a configuration entry

<mark style="color:red;">`DELETE`</mark> `https://api.YOUR_TENANT.appmixer.cloud/config/:key`

#### Path Parameters

| Name                                  | Type   | Description                                |
| ------------------------------------- | ------ | ------------------------------------------ |
| key<mark style="color:red;">\*</mark> | String | The key of the configuration to be removed |

{% tabs %}
{% tab title="200: OK " %}

```javascript
{ "ok": true }
```

{% endtab %}
{% endtabs %}


---

# Agent Instructions: Querying This Documentation

If you need additional information that is not directly available in this page, you can query the documentation dynamically by asking a question.

Perform an HTTP GET request on the current page URL with the `ask` query parameter:

```
GET https://docs.appmixer.com/api/config.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
