import { nativeToScVal } from '@stellar/stellar-sdk'; console.log(nativeToScVal(100*10000000, { type: 'i128' }).toXDR('base64'))
