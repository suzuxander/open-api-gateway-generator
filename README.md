# api-gateway-sample
## 概要
API Gateway、LambdaによるサーバーレスAPIを構築するプロジェクトのサンプル。  
APIクライアント(typescript/axios)、APIのレスポンス(typescript)の型はopenapi-generatorを使用して生成する。  

## 前提
以下はインストール済みとする。
- NodeJS 16くらい
- Java 8くらい (openapi-generatorを実行する際に必要)

## セットアップ
必要なライブラリをインストールする。
```bash
$ npm run init
```

## デプロイ
デプロイを実行する。
```bash
# リソースを生成するAWSアカウントを環境変数に設定する
$ export ACCOUNT_ID={ACCOUNT_ID}
# リソースを生成するリージョンを環境変数に設定する(未指定の場合はap-northeast-1)
$ export REGION={REGION}
# アーティファクトを配置するS3バケットを環境変数に設定する
$ export ARTIFACT_BUCKET={ARTIFACT_BUCKET}

# デプロイ実行
$ npm run deploy
```
デプロイが正常終了したらAPI Gateway、Lambda関数などが生成されている。  
生成されたリソースはマネジメントコンソールのCloudFormationの画面などで確認。

### 動作確認
コマンドラインからAPIを実行できる。以下のコマンドを実行して結果が表示されればOK。  
このコマンドではopenapi generatorで自動生成されたAPIクライアントからAPIにリクエストを送信している。
コードの詳細は[こちら](./lambda/client/get.ts)を参照。
```bash
# APIのURIを環境変数に代入
$ export BASE_PATH={BASE_PATH}

$ node dist/client/get.js
status: 200
response: { id: '00000', name: 'suzuxander' }

# post, deleteのAPIは以下で確認可能
$ node dist/client/post.js
$ node dist/client/delete.js
```
## コードの説明
[openapi.yaml](/openapi/simple/openapi.yaml)で以下のようなAPIを定義している。
```yaml
openapi: 3.0.0

...省略

paths:
  /user/{id}:
    get:
      description: 'user/get/'
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
      responses:
        '200':
          description: 'OK'
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GetUserResponse'
...省略

components:
  schemas:
    GetUserResponse:
      type: object
      properties:
        id:
          type: string
        name:
          type: string                
```

上記のopenapiを使用して`openapi-generator-cli generate`を実行すると、レスポンスの型やAPIクライアントなどのコードが自動生成される。
本プロジェクトでは`npm run generate`を実行することで`gen`ディレクトリ配下に自動生成されるように設定している。

### 生成されるレスポンスの型
以下のようにインターフェースが生成される。
```typescript
/**
 * 
 * @export
 * @interface GetUserResponse
 */
export interface GetUserResponse {
    /**
     * 
     * @type {string}
     * @memberof GetUserResponse
     */
    'id'?: string;
    /**
     * 
     * @type {string}
     * @memberof GetUserResponse
     */
    'name'?: string;
}
```
使用例は[こちら](./lambda/user/get.ts)を参照。

### 生成されるAPIクライアント
```
export class DefaultApi extends BaseAPI {

...省略

    /**
     * 
     * @param {string} id 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    public userIdGet(id: string, options?: AxiosRequestConfig) {
        return DefaultApiFp(this.configuration).userIdGet(id, options).then((request) => request(this.axios, this.basePath));
    }
    
...省略

}
```
使用例は[こちら](./lambda/client/get.ts)を参照。

### APIのエンドポイントを変更/追加する場合
以下に記載するのは本プロジェクトでの設定なので必要に応じて修正する。
1. handerファイルを作成  
   Lambda関数のハンドラーとなるファイルをlambdaディレクトリ配下にファイル名`index.ts`として配置する。

1. openapiを修正  
   [openapi.yaml](/openapi/simple/openapi.yaml)のdescriptionにhandlerのパスを記載する。
   ```
   ...省略
   
     /user/{id}:
       get:
         description: 'user/get/'　# ここにhandlerのパスを記載
         parameters:
           - in: path
             name: id
   ```

1. webpack.config.jsを修正  
   [webpack.config.js](./webpack.config.js)の`entry`の修正する。  
   エントリーポイントは上記openapi.yamlのdescriptionに追加した値 + `/index`とする。
   ```yaml
   ...省略
   
   module.exports = {
     entry: {
       // for api
       'user/get/index': './lambda/user/get.ts',
       'user/post/index': './lambda/user/post.ts',
       'user/delete/index': './lambda/user/delete.ts',
       // for api client
       'client/get': './lambda/client/get.ts',
       'client/post': './lambda/client/post.ts',
       'client/delete': './lambda/client/delete.ts',
       'client/apikey/get': './lambda/client/apikey/get.ts',
       'client/apikey/post': './lambda/client/apikey/post.ts',
       'client/apikey/delete': './lambda/client/apikey/delete.ts',
     },
   
   ...省略
   ```

## APIキー認証ありのAPIの場合
### デプロイ
デプロイ時に`API_TYPE`に"API_KEY_SECURITY"を代入した上で以下コマンドを実行する。
```bash
$ export API_TYPE=API_KEY_SECURITY
$ export ACCOUNT_ID={ACCOUNT_ID}
$ export REGION={REGION}
$ export ARTIFACT_BUCKET={ARTIFACT_BUCKET}

# デプロイ実行
$ npm run deploy
```
デプロイが正常終了したらAPIにAPIキー認証がかかっているはず。

### 動作確認
以下のコマンドを実行して結果が表示されればOK。  
このコマンドではAPIキーをリクエストヘッダーに付与してAPIにリクエストを送信している。  
コードの詳細は[こちら](./lambda/client/apikey/get.ts)を参照。
```bash
# 生成されたAPIキーを環境変数に代入
$ export API_KEY={API_KEY}
$ export BASE_PATH={BASE_PATH}

$ node dist/client/apikey/get.js
status: 200
response: { id: '00000', name: 'suzuxander' }

# post, deleteのAPIは以下で確認可能
$ node dist/client/apikey/post.js
$ node dist/client/apikey/delete.js
```

以下のようにAPIキーをリクエストヘッダーに付与していないクライアントの場合は403エラーが返ってくる。
```bash
$ node dist/client/get.js 
webpack://api-gateway-sample/./node_modules/axios/lib/core/createError.js?:16
  var error = new Error(message);
              ^

Error: Request failed with status code 403
    at createError (webpack://api-gateway-sample/./node_modules/axios/lib/core/createError.js?:16:15)
    at settle (webpack://api-gateway-sample/./node_modules/axios/lib/core/settle.js?:17:12)
    at IncomingMessage.handleStreamEnd (webpack://api-gateway-sample/./node_modules/axios/lib/adapters/http.js?:322:11)
...省略
```
## 参考
- https://github.com/OpenAPITools/openapi-generator-cli