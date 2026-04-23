# Public Files

## Returns a list of the public files

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/public-files`

The list returned does not contain the contents of the files.&#x20;

{% tabs %}
{% tab title="200: OK " %}

```javascript
[
  {
    "filename": "test.txt"
  }
]
```

{% endtab %}
{% endtabs %}

## Upload a public file

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/public-files`

curl --location '<https://acme.com/public-files'\\>
\--header 'Authorization: bearer \[the-admin-token]'\
\--form 'file=@"/tmp/icon.png"'\
\--form 'filename="icon.png"'

#### Request Body

| Name                                       | Type   | Description             |
| ------------------------------------------ | ------ | ----------------------- |
| filename<mark style="color:red;">\*</mark> | String | The name for the file   |
| file<mark style="color:red;">\*</mark>     | File   | The file to be uploaded |

{% tabs %}
{% tab title="200: OK " %}

```javascript
{ "ok": true }
```

{% endtab %}
{% endtabs %}

## Removes a public file

<mark style="color:red;">`DELETE`</mark> `https://api.YOUR_TENANT.appmixer.cloud/public-files/:filename`

#### Path Parameters

| Name                                       | Type   | Description                             |
| ------------------------------------------ | ------ | --------------------------------------- |
| filename<mark style="color:red;">\*</mark> | String | The name of the file you want to remove |

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
GET https://docs.appmixer.com/api/public-files.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
