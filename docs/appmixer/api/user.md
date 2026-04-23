# User

## Sign-in User

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/user/auth`

Sign-in a user with credentials and get their access token.\
\
`curl -XPOST "https://api.appmixer.com/user/auth" -H "Content-type: application/json" -d '{ "username": "abc@example.com", "password": "abc321" }'`

#### Request Body

| Name                                       | Type   | Description                            |
| ------------------------------------------ | ------ | -------------------------------------- |
| password<mark style="color:red;">\*</mark> | string | Password.                              |
| username<mark style="color:red;">\*</mark> | string | Username, has to have an email format. |

{% tabs %}
{% tab title="200 " %}

```javascript
{
    "user": {
        "id": "5c88c7cc04a917256c726c3d",
        "username":"abc@example.com",
        "isActive": false,
        "email": "abc@example.com", 
        "plan":"free",
        "metadata": {}
    },
    "token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVjODhjN2NjMDRhOTE3MjU2YzcyNmMzZCIsInNjb3BlIjpbInVzZXIiXSwiaWF0IjoxNTUyNDkyNjA5LCJleHAiOjE1NTUwODQ2MDl9.9jVcqY0qo9Q_1GeK9Fg14v7OrdpWvzmqnv4jDMZfqnI"
}
```

{% endtab %}
{% endtabs %}

## Create User

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/user`

Create user. By default, this endpoint is open (does not require authentication). This can be changed by setting the API\_USER\_CREATE\_SCOPE [system configuration](https://docs.appmixer.com/appmixer-backoffice/system-configuration). If you set the value of API\_USER\_CREATE\_SCOPE to for example `admin`, then an admin token will be required to call this API.\
\
`curl -XPOST "https://api.appmixer.com/user" -H "Content-type: application/json" -d '{ "username": "abc@example.com", "email": "abc@example.com", "password": "abc321" }'`

#### Request Body

| Name                                       | Type   | Description        |
| ------------------------------------------ | ------ | ------------------ |
| password<mark style="color:red;">\*</mark> | string | Password.          |
| email                                      | string | Email address.     |
| username                                   | string | Email address.     |
| metadata                                   | object | Optional metadata. |

{% tabs %}
{% tab title="201: Created " %}

```javascript
{
    "token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVjODhjN2NjMDRhOTE3MjU2YzcyNmMzZCIsInNjb3BlIjpbInVzZXIiXSwiaWF0IjoxNTUyNDkyNjA5LCJleHAiOjE1NTUwODQ2MDl9.9jVcqY0qo9Q_1GeK9Fg14v7OrdpWvzmqnv4jDMZfqnI"
}
```

{% endtab %}
{% endtabs %}

## Get Current User Information

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/user`

Get current user information.\
\
`curl "https://api.appmixer.com/user" -H "Authorization: Bearer [ACCESS_TOKEN]"`

{% tabs %}
{% tab title="200 " %}

```javascript
{
  "id": "58593f07c3ee4f239dc69ff7",
  "username": "tomas@client.io",
  "isActive": true,
  "email": "tomas@client.io",
  "scope": [
    "user"
  ],
  "metadata": {},
  "plan": "beta"
}
```

{% endtab %}
{% endtabs %}

## Get User Information

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/users/:userId`

Admin token required.

## Get all users

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/users`

Admin token required.

Examples:

Get the first 30 users with a scope "acme1":

curl -XGET "<https://api.appmixer.com/users?filter=scope:acme1\\&sort=created:-1\\&limit=30\\&offset=0>" -H 'Authorization: Bearer \[ADMIN\_TOKEN]'

Get all users whose usernames include a pattern:

curl -XGET "<https://api.appmixer.com/users?pattern=joe>" -H 'Authorization: Beader \[ADMIN\_TOKEN]'

## Get the number of users

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/users/count`

Admin token required

## Update user

<mark style="color:orange;">`PUT`</mark> `https://api.YOUR_TENANT.appmixer.cloud/users/:userId`

Admin token required.

#### Request Body

| Name     | Type          | Description          |
| -------- | ------------- | -------------------- |
| scope    | Array         | Array of scopes.     |
| vendor   | String\|Array | One or more vendors. |
| metadata | Object        | Optional metadata.   |
| email    | String        | Email address.       |

## Delete user

<mark style="color:red;">`DELETE`</mark> `https://api.YOUR_TENANT.appmixer.cloud/users/:userId`

Admin token required. This operation stops all running flows and deletes all the user's data from the system - logs, accounts, tokens ... The response is a ticket, the operation may take a long time. You can use the ticket and poll for the result with the next API method.

{% tabs %}
{% tab title="200: OK Returns JSON with a ticket. Deleting user may take a long time, you can then use the ticket and poll for the result using the next API method. " %}

```javascript
{
    "ticket": "830639e3-c53a-42d6-ad43-0276674236b4"
}
```

{% endtab %}
{% endtabs %}

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/users/:userId/delete-status/:ticket`

{% tabs %}
{% tab title="200: OK " %}

```javascript
{
    "status": "in-progress | completed | failed | cancelled",
    "stepsDone": 4,       // can be used to display a progress bar
    "stepsTotal": 10      // can be used to display a progress bar
}
```

{% endtab %}
{% endtabs %}

## Change user password

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/user/change-password`

User token required.

#### Request Body

| Name                                          | Type   | Description  |
| --------------------------------------------- | ------ | ------------ |
| oldPassword<mark style="color:red;">\*</mark> | String | Old password |
| newPassword<mark style="color:red;">\*</mark> | String | New password |

## Reset user password

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/user/reset-password`

Admin token required.

#### Request Body

| Name                                       | Type   | Description        |
| ------------------------------------------ | ------ | ------------------ |
| email<mark style="color:red;">\*</mark>    | String | User email address |
| password<mark style="color:red;">\*</mark> | String | New password       |

## Forgot Password

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloudforgot-password`

See the[ Forgot Password Service](https://docs.appmixer.com/appmixer-backoffice/system-configuration#forgot-password-service) configuration for more details.

#### Request Body

| Name                                    | Type   | Description   |
| --------------------------------------- | ------ | ------------- |
| email<mark style="color:red;">\*</mark> | String | Email address |

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

## Reset forgotten password

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/forgot-password/reset`

Reset user password by providing a unique code generated via POST `/user/forgot-password` API.

#### Request Body

| Name                                       | Type   | Description                                                          |
| ------------------------------------------ | ------ | -------------------------------------------------------------------- |
| password<mark style="color:red;">\*</mark> | String | New password. The minimum length of the password is five characters. |
| code<mark style="color:red;">\*</mark>     | String | Code generated via forgot-password.                                  |

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
GET https://docs.appmixer.com/api/user.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
