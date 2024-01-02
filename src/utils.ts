import * as dag_json from '@ipld/dag-json' 
import axios from "axios";
import * as didJWT from 'did-jwt'; //NEW WINNER  didJWT.ES256KSigner(didJWT.hexToBytes(debug_parent_privatekey))  
import { ethers } from 'ethers';
import { argon2Verify } from "hash-wasm";
import { CID } from 'multiformats'

import { sha256 } from 'multiformats/hashes/sha2' 



/*
export async function json_to_cid(data: object) { //todo change 
    const bytes = dag_json.encode(data)
    //const bytes = multiformats_json.encode(data)  //This codec does not order json to make it deterministic  just just ignores whitespace and simpler things so we use dag-json
    const hash = await sha256.digest(bytes)


    const cid = CID.create(1, multiformats_json.code, hash)
    return cid.toString();
}
*/





/*
export async function sign_data_jwt(data: object) {
    const signed_data = await didJWT.createJWT(
        { ...data },
        { issuer: my_pub_key, signer: my_privatekey_didJWTsigner },
        { alg: 'ES256K' });

    return (signed_data);
}
*/
