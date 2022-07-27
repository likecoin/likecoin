# Writing NFT metadata Spec

Based on [metadata best practice](./metadata.md)

## Background

The Writing NFT introduced by Liker Land is designed especially for a single piece of article or post. The idea is similar to the traditional book publishing flow as an analogy, but the solution, however, tackles some specific issues for a single piece of writing.

Read more about [Writing NFT here](https://blog.like.co/en/writing-nft-medium-for-textual-works-on-web3/)

## NFT Class metadata

Each writing NFT class represent a creative work registered on an ISCN. To allow easier search and collection of all Writing NFTs created by a same creator, [nft_meta_collection](./metadata.md) fields would be used. A dynamic API is used as uri to provide dynamic metadata according to mint purchase status.

| key                                     | value                                                   | description                                    |
| --------------------------------------- | ------------------------------------------------------- | ---------------------------------------------- |
| name                                    | Writing NFT - {ISCN name}                               | Name of ISCN prefix with Writing NFT           |
| symbol                                  | WRITING                                                 | `WRITING` is used as symbol                    |
| uri                                     | https://api.like.co/likernft/metadata?iscn_id={iscn_id} | Dynamic API from api.like.co, query by ISCN ID |
| metadata                                |                                                         |                                                |
| metadata.nft_meta_collection_id         | likerland_writing_nft                                   | ID of the Writing NFT meta collection          |
| metadata.nft_meta_collection_name       | Writing NFT                                             | Name of Writing NFT meta collection            |
| metadata.nft_meta_collection_descrption | Writing NFT by Liker Land                               | Description of Writing NFT                     |

## NFT Instance metadata

In Writing NFT, every instance of NFT in a same class should be homogeneous. A randomized ID is used to prevent user from distinguishing the minting order. A dynamic API is also used as image to provide dynamic image according to mint purchase status.

| key            | value                                                                 | description                                                |
| -------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| id             | writing-{uuid}                                                        | Randomized uuid v4 prefixed with `writing`                 |
| uri            | https://api.like.co/likernft/metadata?class_id={class_id}&nft_id={id} | Dynamic API from api.like.co, query by class id and nft id |
| metadata       |                                                                       |                                                            |
| metadata.name  | Writing NFT - {ISCN name}                                             | ID of the Writing NFT meta collection                      |
| metadata.image | https://api.like.co/likernft//image/class_${classId}.png              | Name of Writing NFT meta collection                        |

## Registering via api.like.co

To allow the display of Writing NFT on LikeCoin button/NFT widget and related api.like.co APIs, users should call the like.co NFT API to register their NFT after minting.

Please view [api.like.co documentation](api.like.co) for details