# Data Stores

## Get All Stores

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/stores`

Get all key-value stores.\
\
`curl "https://api.appmixer.com/stores" -H "Authorization: Bearer [ACCESS_TOKEN]"`

{% tabs %}
{% tab title="200 Cake successfully retrieved." %}

```javascript
[{
    "name": "My Store 1",
    "storeId": "5c6fc9932ff3ff000747ead4"
}, {
    "name": "My Store 2",
    "storeId": "2a3fc9512bb3fca23747lai2"
}]
```

{% endtab %}
{% endtabs %}

## Get One Store metadata

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/stores/:id`

Get name of a store.\
\
`curl "https://api.appmixer.com/stores/5c6fc9932ff3ff000747ead4" -H "Authorization: Bearer [ACCESS_TOKEN]"`

#### Path Parameters

| Name | Type   | Description |
| ---- | ------ | ----------- |
| id   | string | Store ID.   |

{% tabs %}
{% tab title="200 " %}

```javascript
{
    "name": "My Store 1",
    "storeId": "5c6fc9932ff3ff000747ead4"
}
```

{% endtab %}
{% endtabs %}

## Get Number of Records in a Store

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/store/count`

Get number of records in a store.\
\
`curl "https://api.appmixer.com/store/count?storeId=5c6fc9932ff3ff000747ead4" -H "Authorization: Bearer [ACCESS_TOKEN]"`

#### Path Parameters

| Name    | Type   | Description |
| ------- | ------ | ----------- |
| storeId | string | Store ID.   |

{% tabs %}
{% tab title="200 " %}

```javascript
{
    "count": 681
}
```

{% endtab %}
{% endtabs %}

## Get Store Records

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/store`

Get records. Supports search and pagination.\
\
`curl "https://api.appmixer.com/store?storeId=5b213e0ef90a6200113abfd4&offset=0&limit=30&sort=updatedAt:-1" -H "Authorization: Bearer [ACCESS_TOKEN]"`

#### Query Parameters

| Name    | Type   | Description                                                                                             |
| ------- | ------ | ------------------------------------------------------------------------------------------------------- |
| storeId | string | Store ID.                                                                                               |
| sort    | string | Store record parameter to sort by. Followed by ":" and the sort order -1 (descending) or 1 (ascending). |
| offset  | number | Index of the first record returned.                                                                     |
| limit   | number | Maximum number of records returned.                                                                     |

{% tabs %}
{% tab title="200 " %}

```javascript
[{
    "key":"Box 8RE1",
    "storeId":"5b214ba6f90a6200113abfd8",
    "userId":"583c06511afb7b0016ef120b",
    "updatedAt":"2019-03-06T10:02:20.419Z",
    "value":"321",
    "createdAt":"2019-03-06T10:02:20.419Z"
},{
    "key":"T-shirt T41B",
    "storeId":"5b214ba6f90a6200113abfd8",
    "userId":"583c06511afb7b0016ef120b",
    "updatedAt":"2019-03-06T10:01:59.360Z",
    "value":"18",
    "createdAt":"2019-03-06T10:01:59.360Z"
},{
    "key":"T-shirt A12C",
    "storeId":"5b214ba6f90a6200113abfd8",
    "userId":"583c06511afb7b0016ef120b",
    "updatedAt":"2019-03-06T10:01:45.204Z",
    "value":"12",
    "createdAt":"2019-03-06T10:01:45.204Z"
}]
```

{% endtab %}
{% endtabs %}

## Create a new Store

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/stores`

Create a new key-value store. Returns the newly created Store ID.\
\
`curl -XPOST "https://api.appmixer.com/stores" -H "Authorization: Bearer [ACCESS_TOKEN]" -H "Content-Type: application/json" -d '{ "name": "My Store" }'`

#### Request Body

| Name | Type   | Description        |
| ---- | ------ | ------------------ |
| name | string | Name of the store. |

{% tabs %}
{% tab title="200 " %}

```json
{
    "storeId": "5c7f9bfe51dbaf0007f08db0"
}
```

{% endtab %}
{% endtabs %}

## Delete a Store

<mark style="color:red;">`DELETE`</mark> `https://api.YOUR_TENANT.appmixer.cloud/stores/:id`

Delete a store and all the records in the store.\
\
`curl -XDELETE "https://api.appmixer.com/stores/5c7f9bfe51dbaf0007f08db0" -H "Authorization: Bearer [ACCESS_TOKEN]"`&#x20;

#### Path Parameters

| Name | Type   | Description |
| ---- | ------ | ----------- |
| id   | string | Store ID.   |

{% tabs %}
{% tab title="200 " %}

```
```

{% endtab %}
{% endtabs %}

## Rename a Store

<mark style="color:orange;">`PUT`</mark> `https://api.YOUR_TENANT.appmixer.cloud/stores/:id`

Rename an existing store.\
\
`curl -XPUT "https://api.appmixer.com/stores/5c7f9bfe51dbaf0007f08db0" -H "Authorization: Bearer [ACCESS_TOKEN]" -H "Content-Type: application/json" -d '{ "name": "My New Name" }'`

#### Path Parameters

| Name | Type   | Description |
| ---- | ------ | ----------- |
| id   | string | Store ID.   |

#### Request Body

| Name | Type   | Description            |
| ---- | ------ | ---------------------- |
| name | string | New name of the store. |

{% tabs %}
{% tab title="200 " %}

```javascript
{
    "oldName":"My Old Store Name",
    "storeId":"5c7f9bfe51dbaf0007f08db0"
}
```

{% endtab %}
{% endtabs %}

## Create a new Store Item

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/store/:id/:key`

Create a new value in the store under a key.\
\
`curl -XPOST "https://api.appmixer.com/store/5c7f9bfe51dbaf0007f08db0/mykey" -H "Authorization: Bearer [ACCESS_TOKEN]" -H "Content-Type: text/plain" -d "my value"`

#### Path Parameters

| Name | Type   | Description                                      |
| ---- | ------ | ------------------------------------------------ |
| key  | string | Key under which the posted value will be stored. |
| id   | string | Store ID.                                        |

#### Request Body

| Name | Type   | Description                   |
| ---- | ------ | ----------------------------- |
|      | string | Value to store under the key. |

{% tabs %}
{% tab title="200 " %}

```javascript
{
    "key":"mykey",
    "value":"myvalue",
    "createdAt":"2019-03-06T10:17:58.796Z",
    "updatedAt":"2019-03-06T10:17:58.796Z"
}
```

{% endtab %}
{% endtabs %}

## Update key or value of an existing store item

<mark style="color:purple;">`PATCH`</mark> `https://api.YOUR_TENANT.appmixer.cloud/store/:id/:key`

Use this endpoint to rename a key or update the value against the key. Updates are passed in the body payload.<br>

`curl --location --request PATCH 'https://api.appmixer.com/store/623632fb3eb18366c82aa9fd/existingKey'`\
`--header 'Authorization: Bearer [ACCESS TOKEN]'`\
`--header 'Content-Type: application/json'`\
`--data-raw '{ "key": "newKey", "value": "newValue" }'`

#### Path Parameters

| Name                                  | Type   | Description                              |
| ------------------------------------- | ------ | ---------------------------------------- |
| id<mark style="color:red;">\*</mark>  | String | Store ID                                 |
| key<mark style="color:red;">\*</mark> | String | Key under which the updates are required |

#### Request Body

| Name  | Type   | Description |
| ----- | ------ | ----------- |
| key   | String | New key     |
| value | String | New Value   |

{% tabs %}
{% tab title="200: OK " %}

```javascript
{
    "key": "New Key",
    "value": "New Value"
    "createdAt": "2021-09-01T11:34:00.258+0000",
    "updatedAt": "2021-09-01T11:34:00.258+0000",
}
```

{% endtab %}
{% endtabs %}

## Delete Store Items

<mark style="color:red;">`DELETE`</mark> `https://api.YOUR_TENANT.appmixer.cloud/store`

Delete one or multiple items from a store.\
\
`curl -XDELETE "https://api.appmixer.com/store" -H "Authorization: Bearer [ACCESS_TOKEN]" -H "Content-Type: application/json" -d '[{ key: "mykey", storeId: "5c7f9bfe51dbaf0007f08db0" }, { "key": "mykey2", "storeId": "5c7f9bfe51dbaf0007f08db0" }]'`

#### Request Body

| Name  | Type  | Description                                                                    |
| ----- | ----- | ------------------------------------------------------------------------------ |
| items | array | Array of items to delete. Each item is an object of the form { key, storeId }. |

{% tabs %}
{% tab title="200 " %}

```javascript
{
    "deletedCount": 1
}
```

{% endtab %}
{% endtabs %}

## Download the content of a Data Store

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/store/download/:storeId`

The endpoint downloads the entire store either as a CSV or JSON file.

#### Query Parameters

| Name   | Type   | Description                                      |
| ------ | ------ | ------------------------------------------------ |
| format | String | Default value 'json'. The other option is 'csv'. |

{% tabs %}
{% tab title="200: OK Content-Type: application/octet-stream, Content-Disposition" %}

```javascript
{
    // Response
}
```

{% endtab %}
{% endtabs %}


---

# Agent Instructions: Querying This Documentation

If you need additional information that is not directly available in this page, you can query the documentation dynamically by asking a question.

Perform an HTTP GET request on the current page URL with the `ask` query parameter:

```
GET https://docs.appmixer.com/api/data-stores.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
