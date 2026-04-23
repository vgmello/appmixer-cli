# Files

## Get file info

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/files/metadata/:fileId`

Get the information for the specified file. Note that the file content is not included.

#### Path Parameters

| Name   | Type   | Description                    |
| ------ | ------ | ------------------------------ |
| fileId | string | The UUID of the required file. |

{% tabs %}
{% tab title="200 " %}

```
{
    "length": 146737,
    "chunkSize": 261120,
    "uploadDate": "2020-07-24T19:19:49.755Z",
    "filename": "chart1.png",
    "md5": "1d0ed5eb2cacbab4526de272837102dd",
    "metadata": {
        "userId": "5f15d59cef81ecb3344fab55"
    },
    "contentType": "image/png",
    "fileId": "f179c163-2ad8-4f9d-bce5-95200691b7f9"
}
```

{% endtab %}
{% endtabs %}

## Upload a file

<mark style="color:green;">`POST`</mark> `https://api.YOUR_TENANT.appmixer.cloud/files`

Upload file to Appmixer. Uploads by chunks are supported, and whether if sent file is treated as a chunk or a new file depends on the headers sent. Also, `Content-type` must be set to `multipart/form-data`.

#### Headers

| Name                  | Type   | Description                                                                                                                                                                                                                                                  |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Content-type          | string | Must be set to `multipart/form-data`                                                                                                                                                                                                                         |
| uploader-file-id      | string | If set, the current file will be appended as a chunk to the file specified by this. If not present, a new file will be created. The response includes the resulting file's ID, so it can be used in subsequent requests to add chunks to the generated file. |
| uploader-file-name    | string | The name of the file. This will be ignored in case that `uploader-file-id header` is present.                                                                                                                                                                |
| uploader-chunk-size   | string | The size in bytes of the file/chunk being uploaded.                                                                                                                                                                                                          |
| uploader-chunk-number | string | This header is `uploader-chunk-number`. The ordinal number of this chunk - e.g. the first chunk is 1, the second is 2 and so on.                                                                                                                             |
| uploader-chunks-total | string | This header is `uploader-chunks-total`. The total number of chunks that compose the file. If set to 1, it means that this is the complete file                                                                                                               |

#### Request Body

| Name | Type   | Description                   |
| ---- | ------ | ----------------------------- |
| file | string | The file/chunk to be uploaded |

{% tabs %}
{% tab title="200 The fileId inside the response can be used to upload more chunks for the same file, or in other endpoints to reference this file." %}

```
{
  "length": 146737,
  "chunkSize": 261120,
  "uploadDate": "2020-07-24T20:23:38.565Z",
  "filename": "chart1.png",
  "md5": "1d0ed5eb2cacbab4526de272837102dd",
  "metadata": {
    "userId": "5f15d59cef81ecb3344fab55"
  },
  "contentType": "image/png",
  "fileId": "8cb8fed0-0cd8-4478-8372-9f7cb4eb16e3"
}
```

{% endtab %}
{% endtabs %}

## Get user files

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/files`

Example: <https://api.appmixer.com/[files?limit=10\\&filter=filename:\\~invoice>]\(<http://localhost:2200/files?limit=10\\&filter=filename:~invoice)\\&sort=filename:1>

The example will return 10 files with 'invoice' in the filename.

#### Query Parameters

| Name                        | Type    | Description                                                                                                                                                                           |
| --------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| limit                       | number  |                                                                                                                                                                                       |
| offset                      | number  |                                                                                                                                                                                       |
| sort                        | String  |                                                                                                                                                                                       |
| projection                  | String  |                                                                                                                                                                                       |
| includeComponentSourceFiles | Boolean | By default, the endpoint returns only files (that are used in flows). Custom component source codes are stored as files as well, if the user owns some, they can be returned as well. |
| filter                      | String  |                                                                                                                                                                                       |

{% tabs %}
{% tab title="200: OK " %}

```javascript
[
    {
        "length": 2366210,
        "chunkSize": 261120,
        "uploadDate": "2022-09-14T15:25:33.281Z",
        "filename": "3mb.pdf",
        "md5": "69604bdd54ff681ecd0bf166544c0854",
        "metadata": {
            "userId": "6123bbeb34598f20b676833b"
        },
        "contentType": "application/pdf",
        "fileId": "7b917904-41b8-4c66-9f5f-0c1bf897eab6"
    }
]
```

{% endtab %}
{% endtabs %}

## Get number of files

<mark style="color:blue;">`GET`</mark> `https://api.YOUR_TENANT.appmixer.cloud/files/count`

Used for paging.

#### Query Parameters

| Name                        | Type    | Description                                                                                                                                                                           |
| --------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| includeComponentSourceFiles | Boolean | By default, the endpoint returns only files (that are used in flows). Custom component source codes are stored as files as well, if the user owns some, they can be returned as well. |
| filter                      | String  |                                                                                                                                                                                       |

{% tabs %}
{% tab title="200: OK " %}

```javascript
{
    count: 2
}
```

{% endtab %}
{% endtabs %}

## Remove file.

<mark style="color:red;">`DELETE`</mark> `https://api.YOUR_TENANT.appmixer.cloud/files/:fileId`

{% tabs %}
{% tab title="200: OK " %}

```javascript
{
    // Response
}
```

{% endtab %}
{% endtabs %}

## Delete all user files.

<mark style="color:red;">`DELETE`</mark> `https://api.YOUR_TENANT.appmixer.cloud/files`

Example: DELETE <https://api.appmixer.com/[files?filter=filename:\\~invoice>]\(<http://localhost:2200/files?limit=10\\&filter=filename:~invoice>) will delete all user's files with 'invoice' in the name.

#### Query Parameters

| Name   | Type   | Description                  |
| ------ | ------ | ---------------------------- |
| filter | String | Can be used to filter files. |

{% tabs %}
{% tab title="200: OK " %}

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
GET https://docs.appmixer.com/api/files.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
