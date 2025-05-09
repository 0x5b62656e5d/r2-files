# r2-files

![NPM Version](https://img.shields.io/npm/v/%400x5b62656e5d%2Fr2-files?style=for-the-badge)
![NPM Downloads](https://img.shields.io/npm/d18m/%400x5b62656e5d%2Fr2-files?style=for-the-badge&color=a062fc)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/0x5b62656e5d/r2-files/release-publish.yml?style=for-the-badge&label=Ci%2FCD)
![Codecov](https://img.shields.io/codecov/c/github/0x5b62656e5d/r2-files?style=for-the-badge&logo=codecov)

A simple CLI tool to manage Cloudflare R2 buckets

## Description

This CLI tool helps manage files from a Cloudflare R2 bucket. It can download, upload, list, and delete files from the 
specified bucket. It also automatically copies the link to download the file to the clipboard upon successful upload.

## Installation

Install via npm
```bash
npm install -g @0x5b62656e5d/r2-files
```

## Setup

### Cloudflare setup

This tool requires a Cloudflare account, as well as an active Cloudflare R2 plan. API tokens can be created by heading 
to Cloudflare's R2 Object Storage Overview page, then heading to the Manage API Tokens page.

![Cloudflare R2 API tokens page](https://cdn.pepper.fyi/r2-files/api-tokens-page.png)

Create a token that has Object Read and Write permissions, and note down the Access Key ID, Secret Access Key, and the 
Endpoint URL for S3 clients. Make sure you already have a bucket created to store files.

### Environment variables setup

Create a `.env` file under the following directory: `~/.config/r2-files/`.

Configuration template:

```dosini
R2_ACCESS_KEY_ID=<Your-R2-Access-Key>
R2_SECRET_ACCESS_KEY=<Your-R2-Secret-Access-Key>
R2_ENDPOINT=<Your-R2-Endpoint>
R2_BUCKET=<Your-R2-Bucket-Name>
DOWNLOAD_URL=<Your-R2-Bucket-URL>
```

You can link a custom domain to the bucket for the `DOWNLOAD_URL`. If you don't own a domain, use the Public Development 
URL for `DOWNLOAD_URL`. Make sure that the URL does not end with a `/`.

## Usage

```
NAME
    r2-files - Manage files for a R2 bucket

COMMANDS:
    download <file-key> <download-path> [<download-name>]
        Download a file given the file-key and download-path. Specify download-name to customize the downloaded file's name.
    upload <file-path> [<desired-file-name>]
        Upload a file given the file-path. Specify desired-file-name to customize the uploaded filename in the bucket. Will default to UUID if not desired-file-name is not specified or already exists in the bucket.
    delete <object-key>
        Delete a file given the file-key.
    delete-all -y
        Delete all files in the bucket
    list
        List all the files in the bucket
```

### Examples

Downloads `somefile.txt` into `~/Downlaods/text.txt`
```
r2-files download somefile.txt ~/Downloads/text.txt
```

Uploads `~/Downloads/folder/text.txt` as `text.txt`
```
r2-files upload ~/Downloads/folder/text.txt text.txt
```

Deletes `text.txt` from the bucket
```
r2-files delete text.txt
```

Deletes all files from the bucket
```
r2-files delete-all -y
```

Lists all the files from the bucket
```
r2-files list
```

## Libraries used in this project:

- [@semantic-release/changelog](https://www.npmjs.com/package/@semantic-release/changelog)
- [@semantic-release/commit-analyzer](https://www.npmjs.com/package/@semantic-release/commit-analyzer)
- [@semantic-release/git](https://www.npmjs.com/package/@semantic-release/git)
- [@semantic-release/github](https://www.npmjs.com/package/@semantic-release/github)
- [@semantic-release/release-notes-generator](https://www.npmjs.com/package/@semantic-release/release-notes-generator)
- [@types/node](https://www.npmjs.com/package/@types/node)
- [semantic-release](https://www.npmjs.com/package/semantic-release)
- [typescript](https://www.npmjs.com/package/typescript)
- [@aws-sdk/client-s3](https://www.npmjs.com/package/@aws-sdk/client-s3)
- [@aws-sdk/lib-storage](https://www.npmjs.com/package/@aws-sdk/lib-storage)
- [clipboardy](https://www.npmjs.com/package/clipboardy)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [node-fetch](https://www.npmjs.com/package/node-fetch)
- [uuid](https://www.npmjs.com/package/uuid)
