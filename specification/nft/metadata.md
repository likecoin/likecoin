# NFT metadata best practice

## NFT class and instance metadata reference

No metadata standard is explicitly enforced for LikeCoin NFT. Users and dapp developers can take reference of the OpenSea standard: [https://docs.opensea.io/docs/contract-level-metadata](https://docs.opensea.io/docs/contract-level-metadata)

## NFT Meta Collection for classes

In some use cases, multiple NFT classes might belong to a larger collection. i.e. classes are created and organized to form a collection, We would call these meta collections, please define these metadata fields in the related NFT classes.

| key                             | description                                                               |
| ------------------------------- | ------------------------------------------------------------------------- |
| nft_meta_collection_id          | An ID representing a meta collection , no uniqueness is enforced on chain |
| nft_meta_collection_name        | Human readable name for the meta collection                               |
| nft_meta_collection_description | Human readable description meta collection                                |

Note that these field are merely used as a standardize and convenient way to tag classes. Chain logic does not enforce any uniqueness and validity check for these fields, so it is up to the users and develop to verify if any class tagged with a same `nft_meta_collection_id` actually belongs to any creator or collections.

## Sample

Please refer to [Writing NFT](./writing_nft.md)
