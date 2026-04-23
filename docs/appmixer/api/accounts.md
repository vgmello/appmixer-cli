# Accounts

## Get Accounts

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/auth/:componentType`

Get the list of accounts the user has previously authenticated with for this component type.\
\
`curl "https://api.acme.com/auth/appmixer.slack.list.SendChannelMessage?componentId=e15ef119-8fcb-459b-aaae-2a3f9ee41f15" -H "Authorization: Bearer [ACCESS_TOKEN]"`<br>

#### Path Parameters

| Name          | Type   | Description     |
| ------------- | ------ | --------------- |
| componentType | string | Component Type. |

#### Query Parameters

| Name        | Type   | Description   |
| ----------- | ------ | ------------- |
| componentId | string | Component ID. |

{% tabs %}
{% tab title="200 " %}

```javascript
  "componentType": "appmixer.slack.list.SendChannelMessage",
  "auth": {
    "accounts": {
      "5a6e21f3b266224186ac7d03": {
        "accessTokenValid": true,
        "accountId": "5a6e21f3b266224186ac7d03",
        "tokenId": "5a6e21f3b266224186ac7d04",
        "componentAssigned": true,
        "componentId": "e25dc901-f92a-46a2-8d29-2573d4ad65e5",
        "scopeValid": true,
        "authorizedScope": [
          "channels:read",
          "chat:write:user"
        ],
        "name": "U0UFJ0MFG - client IO",
        "displayName": "client IO"
      }
    }
  }
}
```

{% endtab %}
{% endtabs %}

## Get All Accounts

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/accounts`

Get the list of all accounts the user has authenticated with to any component.\
\
`curl "https://api.appmixer.com/accounts" -H "Authorization: Bearer [ACCESS_TOKEN]"`<br>

#### Query Parameters

| Name   | Type   | Description              |
| ------ | ------ | ------------------------ |
| filter | string | You can filter accounts. |

{% tabs %}
{% tab title="200 " %}

```javascript
[
  {
    "accountId": "5a6e21f3b266224186ac7d03",
    "name": "U0UFJ0MFG - client IO",
    "displayName": null,
    "service": "appmixer:slack",
    "userId": "58593f07c3ee4f239dc69ff7",
    "profileInfo": {
      "id": "U0UFJ0MFG - client IO"
    },
    "icon": "data:image/png;base64,...rkJggg==",
    "label": "Slack"
  },
  {
    "accountId": "5a7313abb3a60729efe76f1e",
    "name": "t.o.mas@client.io",
    "displayName": null,
    "service": "appmixer:pipedrive",
    "userId": "58593f07c3ee4f239dc69ff7",
    "profileInfo": {
      "name": "tomas",
      "email": "t.o.mas@client.io"
    },
    "icon": "data:image/png;base64,...rkJggg==",
    "label": "Pipedrive"
  }
]  
```

{% endtab %}
{% endtabs %}

Example of filtering certain accounts:

```
// filtering acme accounts and aws accounts
curl --request GET 'http://api.acme.com/accounts?filter=service:!acme:[service]&filter=service:!appmixer:aws' \
--header 'Authorization: Bearer [ACCESS_TOKEN]'
```

## Update Account Info

<mark style="color:orange;">`PUT`</mark> `https://api.YOUR_TENANT.appmixer.cloud/accounts/:accountId`

Update account information. Currently, only the display name can be updated. The display name is visible in the Designer inspector when selecting available accounts for a component type and also on the Accounts page.\
\
`curl -XPUT "https://api.appmixer.com/accounts/5a6e21f3b266224186ac7d03" -H "Authorization: Bearer [ACCESS_TOKEN]" -H "Content-Type: application/json" -d '{ "displayName": "My Account Name" }'`

#### Path Parameters

| Name      | Type   | Description                      |
| --------- | ------ | -------------------------------- |
| accountId | string | The ID of the account to update. |

#### Request Body

| Name | Type   | Description                         |
| ---- | ------ | ----------------------------------- |
|      | string | Human-readable name of the account. |

{% tabs %}
{% tab title="200 " %}

```
```

{% endtab %}
{% endtabs %}

## Create Account

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/accounts`

This can be used to create an account. Usually, an account is created when the user authenticates a component. There are scenarios where it is beneficial to create an account without user interaction (Integrations). There has to be an authentication module (auth.js) installed in Appmixer corresponding to the \`service\` ID. All the built-in authentication types are supported (Oauth1, Oauth2, API Key).

#### Query Parameters

| Name               | Type   | Description                                                                                                        |
| ------------------ | ------ | ------------------------------------------------------------------------------------------------------------------ |
| validateScope      | string | If `false`, then the scope of the token from the body won't be validated against components installed in Appmixer. |
| requestProfileInfo | string | If `false`, then the auth module requestProfileInfo function won't be called.                                      |

#### Request Body

| Name        | Type   | Description                                                                                                                     |
| ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| displayName | string | Display name property of the account. This overrides the name of the account in the frontend.                                   |
| name        | string | Name of the account, the authentication will determine the name of the account using the `accountNameFromProfileInfo` property. |
| service     | string | ID (vendor:service) of the service - \`appmixer:google\` for example.                                                           |
| token       | object | <p>The structure of this object depends on the authentication type (Oauth1, Oauth2, API Key).<br></p>                           |
| profileInfo | object | Can be provided directly. If not, `requestProfileInfo` from the authentication module will be called.                           |

{% tabs %}
{% tab title="200 " %}

```
{
    "accountId": "5f841f3a43f477a9fa8fa4e9",
    "name": "[Name of the account]",
    "displayName": null,
    "service": "[vendor:service]",
    "userId": "5f804b96ea48ec47a8c444a7",
    "profileInfo": {
        
    },
    "pre": {},
    "revoked": false
}
```

{% endtab %}
{% endtabs %}

Below is an example of a request to create s Slack (Oauth2) account.&#x20;

```
curl --request POST 'https://api.acme.com/accounts' \
--header 'Authorization: Bearer [ACCESS_TOKEN]' \
--header 'Content-Type: application/json' \
--data-raw '{
    "service": "appmixer:slack",
    "token": {
        "accessToken": "[slack access token]",
        "scope": [
            "channels:write", 
            "groups:write", 
            "channels:read", 
            "channels:history", 
            "groups:read", 
            "groups:history", 
            "users:read", 
            "chat:write:user"
        ]
    },
    "profileInfo": {
        "id" : "[Name of the account that will be used in the frontend]"
    }
}'
```

The `profileInfo` object is optional. If you provide it it will be used. If you do not provide it then the [`requestProfileInfo`](https://docs.appmixer.com/building-connectors/authentication#requestprofileinfo-function-object-or-string-optional) from the authentication module will be used to get the profile info. Slack access tokens do not expire, therefore there is neither an expiration date nor a refresh token in the request.&#x20;

Below is another example, this time for Google (Oauth2) account with access token expiration:

```
curl --request POST 'https://api.acme.com/accounts' \
--header 'Authorization: Bearer [ACCESS_TOKEN]' \
--header 'Content-Type: application/json' \
--data-raw '{
    "service": "appmixer:google",
    "token": {
        "token": "[google access token]",
        "expDate": "2021-02-04 15:34:48.833Z",
        "refreshToken": "[google refresh token]",
        "scope": [
            "https://www.googleapis.com/auth/analytics", 
            "https://www.googleapis.com/auth/analytics.readonly", 
            "https://www.googleapis.com/auth/calendar", 
            "https://www.googleapis.com/auth/calendar.readonly", 
            "https://www.googleapis.com/auth/drive", 
            "https://www.googleapis.com/auth/drive.appdata", 
            "https://www.googleapis.com/auth/drive.file", 
            "https://mail.google.com/", 
            "https://www.googleapis.com/auth/gmail.compose", 
            "https://www.googleapis.com/auth/gmail.send", 
            "https://www.googleapis.com/auth/gmail.readonly", 
            "https://spreadsheets.google.com/feeds", 
            "profile", 
            "email"
        ]
    }
}'
```

An example, this time an API Key account:

```
curl --request POST 'https://api.acme.com/accounts' \
--header 'Authorization: Bearer [ACCESS_TOKEN]' \
--header 'Content-Type: application/json' \
--data-raw '{
    "service": "appmixer:aws",
    "token": {
        "accessKeyId" : "[AWS access key ID]",
        "secretKey" : "[AWS secret key]"
    }
}'
```

Another example with a PWD account type:

```
curl --request POST 'https://api.acme.com/accounts' \
--header 'Authorization: Bearer [ACCESS_TOKEN]' \
--header 'Content-Type: application/json' \
--data-raw '{
    "service": "appmixer:acme",
    "token": {
        "username" : "[username]",
        "password" : "[password]"
    }
}'
```

## Test Account

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/accounts/:accountId/test`

Test account. Check if all the credentials (tokens) are still valid for the account.\
\
`curl -XPOST "https://api.appmixer.com/accounts/5a6e21f3b266224186ac7d03/test" -H "Authorization: Bearer [ACCESS_TOKEN]"`

#### Path Parameters

| Name      | Type   | Description |
| --------- | ------ | ----------- |
| accountId | string | Account ID. |

{% tabs %}
{% tab title="200 " %}

```javascript
{ "5a6e21f3b266224186ac7d04": "valid" }
```

{% endtab %}
{% endtabs %}

## Remove Account

<mark style="color:red;">`DELETE`</mark> `https://api.YOUR_TENANT.appmixer.cloud/accounts/:accountId`

Remove the account and stop all the flows that this account is used in.\
\
`curl -XDELETE "https://api.appmixer.com/accounts/5a6e21f3b266224186ac7d03" -H "Authorization: Bearer [ACCESS_TOKEN]"`

#### Path Parameters

| Name      | Type   | Description |
| --------- | ------ | ----------- |
| accountId | string | Account ID. |

{% tabs %}
{% tab title="200 " %}

```javascript
{ "accountId": "5abcd0ddc4c335326198c1b2" }
```

{% endtab %}
{% endtabs %}

## List All Flows Using Account

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/accounts/:accountId/flows`

List all the flows where the account is used.\
\
`curl "https://api.appmixer.com/accounts/5a6e21f3b266224186ac7d03/flows" -H "Authorization: Bearer [ACCESS_TOKEN]"`

#### Path Parameters

| Name      | Type   | Description |
| --------- | ------ | ----------- |
| accountId | string | Account ID. |

{% tabs %}
{% tab title="200 " %}

```javascript
[
  {
    "flowId": "9251b4b6-4cdb-42ad-9431-1843e05307be",
    "name": "Flow #1"
  },
  {
    "flowId": "777d3024-43f6-4034-ac98-1cb5f320cb3a",
    "name": "Flow #2"
  },
  {
    "flowId": "9089f275-f5a5-4796-ba23-365412c5666e",
    "name": "Flow #3"
  }
]
```

{% endtab %}
{% endtabs %}

## Generate Authentication Session Ticket

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/auth/ticket`

Generate an authentication session ticket. This is the first call to be made before the user can authentication to a service. The flow is as follows:\
\
1\. Generate an authentication session ticket.\
2\. Get an authentication URL.\
3\. Start an authentication session.\
4\. Open the authentication URL in a browser to start the authentication flow.\
5\. Once the user completes the authentication flow, the browser redirects the user to a special Appmixer page which posts a message of the form "appmixer.auth.\[success/failure].\[ticket]" via the window\.postMessage() call: <https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage.\\>
\
Note that this is a low-level mechanism that you don't have to normally deal with. The Appmixer JS SDK handles all this for you.\
\
`curl "https://api.appmixer.com/auth/ticket" -H "Authorization: Bearer [ACCESS_TOKEN]"`

{% tabs %}
{% tab title="200 " %}

```javascript
{ "ticket": "58593f07c3ee4f239dc69ff7:1d2a90df-b192-4a47-aaff-5a80bab66de5" }
```

{% endtab %}
{% endtabs %}

## Get Authentication URL

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/auth/:componentType/auth-url/:ticket`

Get an authentication URL.\
\
`curl "https://api.appmixer.com/auth/appmixer.slack.list.SendChannelMessage/auth-url/58593f07c3ee4f239dc69ff7:1d2a90df-b192-4a47-aaff-5a80bab66de5" -H "Authorization: Bearer [ACCESS_TOKEN]"`

#### Path Parameters

| Name          | Type   | Description            |
| ------------- | ------ | ---------------------- |
| ticket        | string | Authentication ticket. |
| componentType | string | Component type.        |

#### Query Parameters

| Name | Type   | Description   |
| ---- | ------ | ------------- |
|      | string | Component ID. |

{% tabs %}
{% tab title="200 " %}

```
{
    "authUrl": "https://slack.com/oauth/authorize?response_type=code&client_id=25316748213.218351034294&redirect_uri=http%3A%2F%2Flocalhost%3A2200%2Fauth%2Fslack%2Fcallback&state=38133t07c3ee4f369dc69ff7%3A1d2a90df-b192-4a47-aaff-5a80bab66de5&scope=channels%3Aread%2Cchat%3Awrite%3Auser"
}
```

{% endtab %}
{% endtabs %}

## Get Authentication Status

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/auth/status/:ticket`

{% tabs %}
{% tab title="200: OK " %}

```json
{
    "accountId": "5bc0bad6f4cb78001167b173",
    "tokenId": "65c49d44e49f774bb587c4e1",
    "finished": true,
    "updatedAt": "2024-02-08T09:22:12.496Z",
    "error": null
}
```

{% endtab %}
{% endtabs %}

## Clear Authentication From Component

<mark style="color:red;">`DELETE`</mark> `https://api.YOUR_TENANT.appmixer.cloud/auth/component/:componentId`

Clear authentication associated with the component. Note that this call does not remove the account, it only removes the association of an account with a component.\
\
`curl -XDELETE "https://api.appmixer.com/auth/component/e25dc901-f92a-46a2-8d29-2573d4ad65e5" -H "Authorization: Bearer [ACCESS_TOKEN]"`

#### Path Parameters

| Name        | Type   | Description   |
| ----------- | ------ | ------------- |
| componentId | string | Component ID. |

{% tabs %}
{% tab title="200 " %}

```javascript
{ "componentId": "e25dc901-f92a-46a2-8d29-2573d4ad65e5" }
```

{% endtab %}
{% endtabs %}

## Assign Account To Component

<mark style="color:orange;">`PUT`</mark> `https://api.YOUR_TENANT.appmixer.cloud/auth/component/:componentId/:accountId`

Assign an account to a component.\
\
`curl -XPUT "https://api.appmixer.com/auth/component/e25dc901-f92a-46a2-8d29-2573d4ad65e5/5a6e21f3b266224186ac7d03" -H "Authorization: Bearer [ACCESS_TOKEN]"`

#### Path Parameters

| Name        | Type   | Description   |
| ----------- | ------ | ------------- |
| accountId   | string | Account ID.   |
| componentId | string | Component ID. |

{% tabs %}
{% tab title="200 " %}

```javascript
{
    "accountId":"5a6e21f3b266224186ac7d03",
    "componentId":"e25dc901-f92a-46a2-8d29-2573d4ad65e5"
}
```

{% endtab %}
{% endtabs %}


---

# Agent Instructions: Querying This Documentation

If you need additional information that is not directly available in this page, you can query the documentation dynamically by asking a question.

Perform an HTTP GET request on the current page URL with the `ask` query parameter:

```
GET https://docs.appmixer.com/api/accounts.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
