# Apps

## Get Apps

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/apps`

Returns all applications (services or modules) available.\
\
`curl "https://api.appmixer.com/apps" -H "Authorization: Bearer [ACCESS_TOKEN]"`

{% tabs %}
{% tab title="200 Cake successfully retrieved." %}

```javascript
{
    "appmixer.asana": {
        "name": "appmixer.asana",
        "label": "Asana",
        "category": "applications",
        "description": "Asana is a collaborative information manager for workspace. It helps you organize people and tasks effectively.",
        "icon": "data:image/png;base64,iVBORw0KGgoA....kJggg=="
    },
    "appmixer.calendly": {
        "name": "appmixer.calendly",
        "label": "Calendly",
        "category": "applications",
        "description": "Calendly helps you schedule meetings without the back-and-forth emails. It does not work with the free Basic account. It works with Premium or Pro account.",
        "icon": "data:image/png;base64,iVBORw0KGgoA....kJggg=="
    },
    "appmixer.clearbit": {
        "name": "appmixer.clearbit",
        "label": "Clearbit",
        "category": "applications",
        "description": "Clearbit is a data API that lets you enrich your person and company records with social, demographic, and firmographic data.",
        "icon": "data:image/png;base64,iVBORw0KGgoA....kSuQmCC"
    },
    "appmixer.dropbox": {
        "name": "appmixer.dropbox",
        "label": "Dropbox",
        "category": "applications",
        "description": "Dropbox is a home for all your photos, documents, videos, and other files. Dropbox lets you access your stuff from anywhere and makes it easy to share with others.",
        "icon": "data:image/svg+xml;base64,PHN2Z....3N2Zz4="
    },
    "appmixer.evernote": {
        "name": "appmixer.evernote",
        "label": "Evernote",
        "category": "applications",
        "description": "Evernote is a powerful note taking application that makes it easy to capture ideas, images, contacts, and anything else you need to remember. Bring your life's work together in one digital workspace, available on all major mobile platforms and devices.",
        "icon": "data:image/png;base64,iVBORw0KGgoA....kSuQmCC"
    }
}
```

{% endtab %}
{% endtabs %}

## Get App Components

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/apps/components`

Returns all components of an app including their manifest files.\
\
`curl "https://api.appmixer.com/apps/components?app=appmixer.dropbox" -H "Authorization: Bearer [ACCESS_TOKEN]"`

#### Path Parameters

| Name | Type   | Description                                                 |
| ---- | ------ | ----------------------------------------------------------- |
| app  | string | ID of an app as defined in `service.json` or `module.json`. |

{% tabs %}
{% tab title="200 " %}

```
[
    {
        "name": "appmixer.twilio.sms.SendSMS",
        "author": "David Durman <david@client.io>",
        "icon": "data:image/png;base64,iVBORw...gg==",
        "description": "Send SMS text message through Twilio.",
        "auth": { "service": "appmixer:twilio" },
        "inPorts": [
            {
                "name": "message",
                "schema": {
                    "type": "object",
                    "properties": {
                        "body": { "type": "string" },
                        "to": { "type": "string" }
                    },
                    "required": [ "to" ]
                },
                "inspector": {
                    "inputs": {
                        "body": {
                            "type": "text",
                            "label": "Text message",
                            "tooltip": "Text message that should be sent.",
                            "index": 1
                        },
                        "to": {
                            "type": "text",
                            "label": "To number",
                            "tooltip": "The destination phone number. <br/><br/>Format with a '+' and country code e.g., +16175551212 (E.164 format).",
                            "index": 2
                        }
                    }
                }
            }
        ],
        "properties": {
            "schema": {
                "properties": {
                    "fromNumber": { "type": "string" }
                },
                "required": [ "fromNumber" ]
            },
            "inspector": {
                "inputs": {
                    "fromNumber": {
                        "type": "select",
                        "label": "From number",
                        "tooltip": "Select Twilio phone number.",
                        "index": 1,
                        "source": {
                            "url": "/component/appmixer/twilio/sms/ListFromNumbers?outPort=numbers",
                            "data": {
                                "transform": "./transformers#fromNumbersToSelectArray"
                            }
                        }
                    }
                }
            }
        }
    },
    {
        "name": "appmixer.twilio.calls.NewCall",
        "author": "David Durman <david@client.io>",
        "icon": "data:image/png;base64,iVBORw...gg==",
        "description": "Receive a call through Twilio.",
        "auth": { "service": "appmixer:twilio" },
        "webhook": true,
        "webhookAsync": true,
        "outPorts": [
            {
                "name": "call",
                "options": []
            }
        ],
        "properties": {
            "schema": {
                "properties": {
                    "generateInspector": { "type": "boolean" },
                    "url": {}
                }
            },
            "inspector": {
                "inputs": {
                    "url": {
                        "source": {
                            "url": "/component/appmixer/twilio/calls/NewCall?outPort=call",
                            "data": {
                                "properties": {
                                    "generateInspector": true
                                }
                            }
                        }
                    }
                }
            }
        }
    }
]
```

{% endtab %}
{% endtabs %}

## Get All Components

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/components`

Get all available components.\
\
`curl "https://api.appmixer.com/components" -H "Authorization: Bearer [ACCESS_TOKEN]"`

#### Query Parameters

| Name     | Type   | Description                                                                          |
| -------- | ------ | ------------------------------------------------------------------------------------ |
| manifest | string | If set to "yes", the endpoint returns all components including their manifest files. |

{% tabs %}
{% tab title="200 " %}

```
[
    "appmixer.asana.projects.CreateProject",
    "appmixer.asana.projects.NewProject",
    "appmixer.asana.tasks.CreateStory",
    "appmixer.calendly.events.InviteeCanceled",
    "appmixer.calendly.events.InviteeCreated",
    "appmixer.clearbit.enrichment.FindCompany",
    "appmixer.clearbit.enrichment.FindPerson"
]
```

{% endtab %}
{% endtabs %}

## Publish A Component/Module/Service

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/components`

Publish a new component, new module or an entire service or update an existing component/module/service. The uploaded entity must be zipped and must have a proper directory/file structure inside (See Basic Component Structure for more details). Note that you can use the Appmixer CLI tool to pack your component/service/module to a zip archive (`appmixer pack` command). Alternatively, you can also use a regular zip command line utility but you should omit the node\_modules/ directories before archiving and the root directory of the zip archive must match the vendor name. The directory hierarchy must have a well defined structure: `[vendor]/[service]/[module]/[component]`.\
\
The size limit of the zip archive is 10MB.\
\
Publishing a new component can take more time than a lifespan of a single HTTP request. Therefore, the result of the publishing HTTP call is a JSON object with `ticket` property. You can use the ticket to check for progress of the publish using the `/components/uploader/:ticket` endpoint.\
\
`curl -XPOST "https://api.appmixer.com/components" -H "Authorization: Bearer [ACCESS_TOKEN]" -H "Content-type: application/octet-stream" --data-binary @appmixer.myservice.zip`

{% tabs %}
{% tab title="200 " %}

```
{
    "ticket":"a194d145-3768-4a8a-84a4-4f1e4e08c4ad"
}
```

{% endtab %}
{% endtabs %}

## Check for Publishing Progress

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/components/uploader/:ticket`

Check for progress of publishing a component.\
\
`curl -XGET "https://api.appmixer.com/components/uploader/2e9dd726-2b7f-46f7-bea4-8db7f7175aa8" -H "Authorization: Bearer [ACCESS_TOKEN]" -H "Content-type: application/json"`

#### Path Parameters

| Name   | Type   | Description                                           |
| ------ | ------ | ----------------------------------------------------- |
| ticket | string | Ticket that you got from the POST /component request. |

{% tabs %}
{% tab title="200 " %}

```
// Successful upload. No errors:
{
  "finished": "2020-02-28T15:57:34.549Z"
}


// Upload finished. Errors encountered:
{
  "finished": "2020-02-28T15:25:39.515Z",
  "err": "Invalid schema for appmixer/utils/service.json",
  "data": [
    {
      "keyword": "required",
      "dataPath": "",
      "schemaPath": "#/required",
      "params": {
        "missingProperty": "label"
      },
      "message": "should have required property 'label'"
    },
    {
      "keyword": "required",
      "dataPath": "",
      "schemaPath": "#/required",
      "params": {
        "missingProperty": "description"
      },
      "message": "should have required property 'description'"
    }
  ]
}
```

{% endtab %}
{% endtabs %}

## Delete a Component/Module/Service

<mark style="color:red;">`DELETE`</mark> `https://api.YOUR_TENANT.appmixer.cloud/components/:selector`

Delete a component/module or an entire service.\
\
`curl -XDELETE "https://api.appmixer.com/components/appmixer.myservice" -H "Authorization: Bearer [ACCESS_TOKEN]" -H "Content-type: application/json"`

#### Path Parameters

| Name     | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                     |
| -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| selector | string | A selector that uniquely identifies the service/module/component to delete. The selector is of the form \[vendor].\[service].\[module].\[component]. For example "appmixer.google.calendar.CreateEvent" (removes just one component) or "appmixer.google.calendar" (removes the calendar module) or "appmixer.google" (removes the entire Google service including all modules and components). |

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
GET https://docs.appmixer.com/api/apps.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
