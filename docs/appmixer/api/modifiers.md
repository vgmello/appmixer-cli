# Modifiers

## Get Modifiers

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/modifiers`

Get available modifiers. Appmixer is shipped by default with its own set of modifiers by default. Checkout this API to see what they are. You can then redefine the default set with the following API endpoint.

{% tabs %}
{% tab title="200 Retrieves two objects: categories and modifiers" %}

```
{
    "categories": {
        "object": {
            "label": "Object",
            "index": 1
        },
        "list": {
            "label": "List",
            "index": 2
        },
        ...
    },
    "modifiers": {
        "g_stringify": {
            "name": "stringify",
            "label": "Stringify",
            "category": [
                "object",
                "list"
            ],
            "description": "Convert an object or list to a JSON string.",
            "arguments": [
                {
                    "name": "space",
                    "type": "number",
                    "isHash": true
                }
            ],
            "returns": {
                "type": "string"
            },
            "helperFn": "function(value, { hash }) {\n\n                return JSON.stringify(value, null, hash.space);\n            }"
        },
        "g_length": {
            "name": "length",
            "label": "Length",
            "category": [
                "list",
                "text"
            ],
            "description": "Find length of text or list.",
            "arguments": [],
            "returns": {
                "type": "number"
            },
            "helperFn": "function(value) {\n\n                return value && value.hasOwnProperty('length') ? value.length : 0;\n            }"
        },
        ...
    }
    
}
```

{% endtab %}
{% endtabs %}

## Edit Modifiers

<mark style="color:orange;">`PUT`</mark> `https://api.YOUR_TENANT.appmixer.cloud/modifiers`

Change the modifiers and their categories as a whole. Restricted to **admin** users only. Before editing existing modifiers or adding new ones, checkout the GET /modifiers API to see the structure.

#### Request Body

| Name       | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| categories | object | <p>The object containing available modifier categories. Each category is composed by the following properties:<br>- <strong>label</strong>: label to be shown in the Modifier Editor. It can be overridden by string customization.<br>- <strong>index</strong>: position on which this category is displayed in the Modifier Editor.</p>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| modifiers  | object | <p>The object containing available modifiers. Each modifier is composed of the following properties:<br><strong>- label:</strong> label to be shown in the Modifier Editor. Can be overridden by string customization.<br><strong>- category:</strong> an array containing the categories which the modifier will appear under.<br><strong>- description:</strong> short description of the modifier. It will appear under modifier's label. Can be overridden by string customization.<br><strong>- arguments (optional):</strong> an array of objects describing the arguments for the modifier if there is any. For each argument, an inspector field is generated in the editor. The structure of each object is <code>{</code> <br>  <code>name: String,</code> <br>  <code>type: String,</code> <br>  <code>isHash: Boolean, Optional</code> <br><code>}</code><br><strong>- returns (optional):</strong> an object with just one property type indicating the expected return type.<br><strong>- isBlock (optional):</strong> boolean. Indicates if this is a block modifier.<br><strong>- private (optional):</strong> boolean. Indicates if the modifier is private and therefore not available for users.<br><strong>- variableArguments (optional):</strong> boolean. If set to true the modifier accepts any number of arguments. The inspector will render an "Add" button to add as many arguments as the user wants.<br>- <strong>helperFn</strong>: the javascript function as a string, which does the transformation of the variable. The function definition can have arguments being the first one always the variable value, and the subsequent each of the modifier's arguments, in the same order they are defined on <code>arguments</code> array.</p> |

{% tabs %}
{% tab title="200 It returns the whole updated definition, like the GET endpoint." %}

```
{
    "categories": {
        "object": {
            "label": "Object",
            "index": 1
        },
        "list": {
            "label": "List",
            "index": 2
        },
        ...
    },
    "modifiers": {
        "g_stringify": {
            "name": "stringify",
            "label": "Stringify",
            "category": [
                "object",
                "list"
            ],
            "description": "Convert an object or list to a JSON string.",
            "arguments": [
                {
                    "name": "space",
                    "type": "number",
                    "isHash": true
                }
            ],
            "returns": {
                "type": "string"
            },
            "helperFn": "function(value, { hash }) {\n\n                return JSON.stringify(value, null, hash.space);\n            }"
        },
        "g_length": {
            "name": "length",
            "label": "Length",
            "category": [
                "list",
                "text"
            ],
            "description": "Find length of text or list.",
            "arguments": [],
            "returns": {
                "type": "number"
            },
            "helperFn": "function(value) {\n\n                return value && value.hasOwnProperty('length') ? value.length : 0;\n            }"
        },
        ...
    }
    
}
```

{% endtab %}
{% endtabs %}

## Delete Modifiers

<mark style="color:red;">`DELETE`</mark> `https://api.YOUR_TENANT.appmixer.cloud/modifiers`

Delete all modifiers. Restricted to **admin** users only.

{% tabs %}
{% tab title="200 Empty response" %}

```
{}
```

{% endtab %}
{% endtabs %}

## Test Modifier Function

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/modifiers/test`

This endpoint can be used to test a helper function with the desired arguments, to check how it will behave under different conditions.\
\
`curl -XPOST "https://api.appmixer.com/modifiers/test" -H "Content-type: application/json" -H "Authorization: Bearer [ACCESS-TOKEN]" -d '{ "helperFn": "function(value) { return value && value.hasOwnProperty('\''length'\'') ? value.length : 0; }", "arguments": ["test"]}'`

#### Request Body

| Name      | Type   | Description                                        |
| --------- | ------ | -------------------------------------------------- |
| helperFn  | string | The Javascript helper function as a string.        |
| arguments | array  | The arguments to be passed to the helper function. |

{% tabs %}
{% tab title="200 The endpoint will respond with the returned value from the helperFn." %}

```
4
```

{% endtab %}

{% tab title="400 The helper function must always return a value. In the case it does not, this response is received." %}

```
{
    "statusCode": 400,
    "error": "Bad Request",
    "message": "The function returned \"undefined\""
}
```

{% endtab %}
{% endtabs %}


---

# Agent Instructions: Querying This Documentation

If you need additional information that is not directly available in this page, you can query the documentation dynamically by asking a question.

Perform an HTTP GET request on the current page URL with the `ask` query parameter:

```
GET https://docs.appmixer.com/api/modifiers.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
