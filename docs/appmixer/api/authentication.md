# Authentication

The vast majority of API endpoints within the Appmixer require an access token to execute the calls. The following methods explain how to create a user and obtain the access token through the sign-in endpoint.&#x20;

## Sign-in User

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/user/auth`

Sign in a user with credentials and get their access token.\
\
`curl -XPOST "https://api.appmixer.com/user/auth" -H "Content-type: application/json" -d '{ "username": "abc@example.com", "password": "abc321" }'`

You can sign in either with your `username` and `password` or with your `email` and `password`.

#### Request Body

| Name                                       | Type   | Description                                                                                                              |
| ------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| password<mark style="color:red;">\*</mark> | string | Password.                                                                                                                |
| username                                   | string | Username. If the email is not provided in the body, a username is required. Hence, a username or email must be included. |
| email                                      | string | Email. If the username is not provided in the body, an email is required. Hence, a username or email must be included.   |

{% tabs %}
{% tab title="200 " %}

```javascript
{
    "user": {
        "id": "5c88c7cc04a917256c726c3d",
        "username":"abc@example.com",
        "isActive": false,
        "email": "abc@example.com", 
        "plan":"free"
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

| Name                                       | Type   | Description    |
| ------------------------------------------ | ------ | -------------- |
| password<mark style="color:red;">\*</mark> | string | Password.      |
| email<mark style="color:red;">\*</mark>    | string | Email address. |
| username<mark style="color:red;">\*</mark> | string | Username.      |

{% tabs %}
{% tab title="200 " %}

```javascript
{
    "token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVjODhjN2NjMDRhOTE3MjU2YzcyNmMzZCIsInNjb3BlIjpbInVzZXIiXSwiaWF0IjoxNTUyNDkyNjA5LCJleHAiOjE1NTUwODQ2MDl9.9jVcqY0qo9Q_1GeK9Fg14v7OrdpWvzmqnv4jDMZfqnI"
}
```

{% endtab %}
{% endtabs %}

## Get User Information

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/user`

Get user information.\
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
  "plan": "beta"
}
```

{% endtab %}
{% endtabs %}


---

# Agent Instructions: Querying This Documentation

If you need additional information that is not directly available in this page, you can query the documentation dynamically by asking a question.

Perform an HTTP GET request on the current page URL with the `ask` query parameter:

```
GET https://docs.appmixer.com/api/authentication.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
