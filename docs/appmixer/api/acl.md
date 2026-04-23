# ACL

## Get ACL types

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/acl-types`

There are two types of access control lists, for components and for API routes. Restricted to **admin** users only.

{% tabs %}
{% tab title="200 Currently there are ACL rules for components and routes. In the future, other types might be added." %}

```javascript
[
    "routes",
    "components"
]
```

{% endtab %}
{% endtabs %}

## Get ACL rules for components|routes

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/acl/:type`

Get list of all the ACL rules for given type. Restricted to **admin** users only.

#### Path Parameters

| Name | Type   | Description          |
| ---- | ------ | -------------------- |
| type | string | components \| routes |

{% tabs %}
{% tab title="200 This is default list of ACL rules for components. All users can access all components." %}

```
[
    {
        "role": "admin",
        "resource": "*",
        "action": [
            "*"
        ],
        "attributes": [
            "non-private"
        ]
    },
    {
        "role": "user",
        "resource": "*",
        "action": [
            "*"
        ],
        "attributes": [
            "non-private"
        ]
    },
    {
        "role": "tester",
        "resource": "*",
        "action": [
            "*"
        ],
        "attributes": [
            "non-private"
        ]
    }
]
```

{% endtab %}
{% endtabs %}

## Update ACL rules

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/acl/:type`

Update ACL rule set for given type. Restricted to **admin** users only.

#### Path Parameters

| Name | Type   | Description          |
| ---- | ------ | -------------------- |
| type | string | components \| routes |

#### Request Body

| Name | Type  | Description                                                                                                            |      |                                            |                                                            |                                                   |             |              |
| ---- | ----- | ---------------------------------------------------------------------------------------------------------------------- | ---- | ------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------- | ----------- | ------------ |
|      | array | <p>Body has to be an array of ACL rules, where each rule has the following structure:<br>{<br>    role: string - admin | user | tester ...<br>    resource: string - flows | appmixer.utils.\* ...<br>    action: array of strings - \* | read ...<br>    attributes: array of strings - \* | non-private | ...<br>}</p> |

{% tabs %}
{% tab title="200 " %}

```
```

{% endtab %}
{% endtabs %}

## Get available resource values

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/acl/:type/resources`

Get available values for **resource** property for an ACL rule. This is used for building UI in Backoffice for setting ACL rules. Restricted to **admin** users only.

#### Path Parameters

| Name | Type   | Description          |
| ---- | ------ | -------------------- |
| type | string | components \| routes |

{% tabs %}
{% tab title="200 Available options for routes type. In case of components it returns pattern that a resource has to match." %}

```
['*', 'flows']
```

{% endtab %}
{% endtabs %}

## Get available action values

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/acl/:type/actions`

Get available values for **action** property for an ACL rule. This is used for building UI in Backoffice for setting ACL rules. Restricted to **admin** users only.

#### Path Parameters

| Name | Type   | Description          |
| ---- | ------ | -------------------- |
| type | string | components \| routes |

{% tabs %}
{% tab title="200 Available options for routes type." %}

```
['*', 'read', '!read', 'create', '!create', 'update', '!update', 'delete', '!delete']
```

{% endtab %}
{% endtabs %}

## Get available options for attributes property.

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/acl/:type/resource/:resource/attributes`

Get available values for **attributes** property for an ACL rules. This is used for building UI in Backoffice for setting ACL rules. Restricted to **admin** users only.

#### Path Parameters

| Name     | Type   | Description                                            |
| -------- | ------ | ------------------------------------------------------ |
| type     | string | components \| routes                                   |
| resource | string | resource name - flows, appmixer.utils.controls.\*, ... |

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
GET https://docs.appmixer.com/api/acl.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
