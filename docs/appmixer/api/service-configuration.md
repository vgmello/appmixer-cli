# Connector Configuration

{% hint style="warning" %}
Only users with admin scope can use these endpoints.
{% endhint %}

## Get Services Configuration

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/service-config`

Get a list of stored configurations.

#### Query Parameters

| Name    | Type   | Description                                                                                                |
| ------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| pattern | string | A term to filter configurations containing pattern on their service id                                     |
| sort    | string | Sorting parameter. Service id can be used to sort results alphabetically by their id. Example: serviceId:1 |
| offset  | number | Index of the first item returned. Default is 0. Useful for paging.                                         |
| limit   | number | Maximum items returned. Default is 100. Useful for paging.                                                 |

{% tabs %}
{% tab title="200 " %}

```
[
	{
		"serviceId": "appmixer:google",
		"clientID": "my-global-client-id",
		"clientSecret": "my-global-client-secret"
	},
	{
		"serviceId": "appmixer:evernote",
		"sandbox": true,
	}
]
```

{% endtab %}
{% endtabs %}

## Get Service Configuration

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/service-config/:serviceId`

Get the configuration stored for the given service.

#### Path Parameters

| Name | Type   | Description                              |
| ---- | ------ | ---------------------------------------- |
|      | string | The service id. Example: appmixer:google |

{% tabs %}
{% tab title="200 " %}

```
{
	"serviceId": "appmixer:google",
	"clientID": "my-global-client-id",
	"clientSecret": "my-global-client-secret"
}
```

{% endtab %}
{% endtabs %}

## Create Service Configuration

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/service-config`

Creates a new configuration for a service. The only required parameter on the payload is the *serviceId*. The rest of the payload can be any key/value pairs that will be the desired configuration for the service. For example:\
\
`{` \
&#x20; `"serviceId": "appmixer:google",` \
&#x20; `"clientID": "my-global-client-id",` \
&#x20; `"clientSecret": "my-global-client-secret"` \
`}`

#### Request Body

| Name      | Type   | Description                                                                        |
| --------- | ------ | ---------------------------------------------------------------------------------- |
| whatever  | string | Any value for the whatever-key                                                     |
| serviceId | string | The serviceId. It should be in the form `vendor:service`. Example: appmixer:google |

{% tabs %}
{% tab title="200 " %}

```
{
	"serviceId": "appmixer:google",
	"clientID": "my-global-client-id",
	"clientSecret": "my-global-client-secret"
}
```

{% endtab %}
{% endtabs %}

## Update Service Configuration

<mark style="color:orange;">`PUT`</mark> `https://api.YOUR_TENANT.appmixer.cloud/service-config/:serviceId`

Updates the stored configuration for the given service. The payload should contain the whole configuration, as the payload content will overwrite the configuration stored under the service.

#### Path Parameters

| Name      | Type   | Description             |
| --------- | ------ | ----------------------- |
| serviceId | string | The service id. Example |

#### Request Body

| Name         | Type   | Description        |
| ------------ | ------ | ------------------ |
| whatever-key | string | Any value you need |

{% tabs %}
{% tab title="200 " %}

```
{
	"serviceId": "appmixer:google",
	"clientID": "my-global-client-id",
	"clientSecret": "my-global-client-secret"
}
```

{% endtab %}
{% endtabs %}

## Delete Service Configuration

<mark style="color:red;">`DELETE`</mark> `https://api.YOUR_TENANT.appmixer.cloud/service-config/:serviceId`

Removes the configuration from the given service.

#### Path Parameters

| Name      | Type   | Description                              |
| --------- | ------ | ---------------------------------------- |
| serviceId | string | The service id. Example: appmixer:google |

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
GET https://docs.appmixer.com/api/service-configuration.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
