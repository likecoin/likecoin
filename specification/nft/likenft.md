# LikeCoin NFT Module Spec

Created: February 17, 2022 8:12 PM

## Changelog

* 2022-02-18: Initial Draft
* 2022-03-03: Update for feedback from LikerLand: Rename query interfaces, Include ISCN version at first mint in metadata, Clarify relation to ISCN
* 2022-03-04: Add pagination to ClassesByISCN query, Only Return ISCN ID at ClassByISCNIndex query, Emit event after mutations
* 2022-03-08: Fix protobuf indentation. Update ClassesByISCN query to return non-nullable class objects.
* 2022-04-30: Add support for account-related NFT Class. Add max supply and blind box feature. Fix protobuf lint issues.
* 2022-06-14: Update module params. Add royalty rate in class config. Add Marketplace feature.
* 2022-06-16: Add module params for marketplace.
* 2022-06-28: Add royalty config store. Rename the term MintableNFT to BlindBoxContent. Refactor BlindBoxState in class data. State that fee per byte is applicable to class data as well.
* 2022-07-04: Finalize sdk version for initial release. Add info on future improvements.

### Authors

* Elliot Ng [elliotng@oursky.com](mailto:elliotng@oursky.com) (@chihimng)
* Rick Mak [rickmak@oursky.com](mailto:rickmak@oursky.com) (@rickmak)
* Rico Wong [hochiw@oursky.com](mailto:hochiw@oursky.com) (@hochiw)

## Abstract

We propose x/likenft, a module that utilizes Cosmos SDK’s x/nft and extends x/iscn to enable users to create NFT Classes and mint NFTs under an ISCN record or an account. The module keeps mappings of parent to NFT class relations, and implements mutation functions as outlined by ADR-43 for users to interact with objects kept by x/nft. In addition, the module provides blind box release and basic marketplace features for users to purchase and trade NFTs with LikeCoin. By adopting x/nft, the module will have a clear pathway to support interchain transfer as relevant IBC standards are being finalized.

Our work-in-progress codebase and pre-release builds can be found at: [https://github.com/oursky/likecoin-chain/tree/feat/nft](https://github.com/oursky/likecoin-chain/tree/feat/nft)

## Background

### Envisioned Usages

We envision that a creator will create NFT collections tied to their DePub content or their identity for monetization. After creating NFT classes, the creator can either mint tokens directly to their own account for resale, or adopt the blind box feature to allow supporters to mint tokens at set prices.

To trade tokens, users will be able to create seller listings and buyer offers on-chain, as well as authorizing DApp custody accounts to transfer tokens for off-chain sales. Secondary sales on LikeCoin chain will split royalties to the class owner at a rate defined before tokens are minted.

In the future, when an IBC standard for interchain NFT transfer is established, token owners can send NFTs to third party chains for complex sales such as bidding, similar to how a user can swap fungible tokens on DEX chains like Osmosis.

### Selection of Token Standard

There exists multiple token standards already in use by other blockchains: native modules by Irisnet, Crypro.org and Omniflex; as well as cw721, a smart contract based standard for CosmWasm. Also, we have identified that x/nft is to be released in Cosmos SDK v0.46, and is the basis of the current draft of ICS-721, the IBC standard for cross-chain NFT transfer.

During discussion with LikerLand and Depub.space teams, we have compared pros and cons between native modules (represented by x/nft) and cw721. Firstly, x/nft has a clear pathway for IBC support while cw721 doesn’t. Moreover, incorporating cw721 implies integrating CosmWasm, which brings chain sovereignty concerns and costs greater development effort. Therefore, we are in favor of adopting x/nft for use on LikeCoin chain.

These being said, it is still unclear which standard will become dominant in the Cosmos ecosystem. At this moment, it seems to us that x/nft will likely be the winner with Irisnet already working on migrating their module to support the standard. In the event of the community favoring cw721 over native tokens, we believe that there will be community efforts among multiple chains to create migration or bridging solutions.

## Object Relations

### ISCN-related Class and NFT

```markdown
Account 1 - n ISCN 1 - n Class 1 - n NFT
```

* This is for representing tokens related to a DePub content
  * e.g. Virtual “signed copies”, memorial tokens
* Under the scope of this module, we refer to an ISCN record with its `IscnIdPrefix`
  * The latest ISCN record is always used in logics and returned in queries
    * e.g. The latest ISCN record owner is always resolved as the class owner when a owner-only mutation is processed.
  * Users can look up historical versions with the ISCN module
  * To counter the misuse of ISCN versioning, where a user could theoretically replace the ISCN record content entirely after minting NFT, the latest ISCN version observed at the first token minting is recorded in Class data and in all minted NFTs
    * Users are expected to register a different ISCN for entirely new content, for example a subsequent work in a publication series.
* There can be multiple `Class` (or “Collection” in OpenSea speak) related to an ISCN
  * e.g. “Initial Series” at publication time, and another NFT class in the future as “Anniversary Series”

### Account-related Class and NFT

```markdown
Account 1 - n Class 1 - n NFT
```

* This is for representing tokens related to the Creator’s identity
  * e.g. Supporter membership status
* There can be multiple `Class` related to an Account
  * e.g. Different supporter tiers

## User Flows

### Simple Mint

* Creator call `MsgNewClass` to create NFT Class related to their account or a ISCN record, and call `MsgUpdateClass` as needed.
  * Creator assign metadata of the collection, and change configurations such as burnable and max supply.
* Creator call `MsgMintNFT` to mint NFT under the Class.
  * Creator assign metadata of the token.
* Creator list NFT for sale with marketplace features, or call `MsgSendNFT` to transfer the token to another account.

### Blind Box Release

* Creator call `MsgNewClass` to create NFT Class related to their account or a ISCN record, and call `MsgUpdateClass` as needed.
  * Creator specify the mint stages and reveal time
    * Mint stages controls the permission to mint: start time, allowlist of minters and mint price
    * This can be utilized to create early bird discounts, or allow vip users to mint tokens before the public, etc.
  * Creator assign metadata of the collection, and change configurations such as burnable and max supply.
* Creator call `MsgCreateBlindBoxContent`, `MsgUpdateBlindBoxContent`, `MsgDeleteBlindBoxContent` to prepare metadata of available tokens.
* Supporters can call `MsgMintNFT` to mint unrevealed tokens before the reveal time.
  * Permission is checked against mint stages configured, sorted by start time and mint price in ascending order.
    * i.e. the earliest and cheapest eligible stages will be applied
  * Mint fee collected will be paid to the Creator.
* At the reveal time, the chain will mint all remaining token supply to the Creator, shuffle blind box content with the last block hash as seed, and assign content to all NFTs.
  * This shuffle process is fair to all parties, on the basis that it is improbable for adversaries to know the exact hash of a future block, and thus knowing which token id is more valuable at mint time.
* Creator can then list the unsold tokens for sale again on the marketplace, or choose to burn them if burnable is enabled.

### Royalty Config

* Class owner call `MsgCreateRoyaltyConfig` to configure the royalty rate and stakeholders.
  * In marketplace transactions, royalty is split according to the royalty rate (rounded down to nanolike), and distributed to stakeholders according to the stakeholder weights (rounded down to nanolike). All rounding remainders will be sent to the seller.
  * Class owner may call `MsgUpdateRoyaltyConfig` to change the settings, or `MsgDeleteRoyaltyConfig` to disable the royalty feature.
  * Note the royalty stakeholders are user-managed, and does not mirror ISCN stakeholders automatically.

### Trade with Seller Listing

* NFT owner call `MsgCreateListing` to list the token for sale, and call `MsgUpdateListing` and `MsgDeleteListing` as needed.
  * NFT owner specifies price and expiration
    * Max listing duration is 180 days. When a listing is expired the chain will prune the record automatically. Users may call `MsgUpdateListing` to extend the expiration.
  * Each user can only have one active listing for each NFT.
* User look for listings with `QueryListingsByNFTRequest` . After verifying the listing is created by the current NFT owner via x/nft `QueryOwnerRequest`, user call `MsgBuyNFT` to purchase.
  * User specifies the listing by class id, nft id and seller address. User can specify a final price at or higher than the listed price.
  * Portion of the final price will be sent to royalty stakeholders according to the royalty config set by class owner.
  * Note that listings returned at queries might be created by previous owners and invalid. Front-end / user should verify the seller before purchase to save gas fee.
    * The module actively remove invalid listings at successful trades, new listing creation and scheduled listing expirations.
    * However, it is possible for a NFT owner to transfer the token via x/nft directly, causing invalid listings to be kept in module state.

### Trade with Buyer Offer

* User call `MsgCreateOffer` to offer to buy a token, and call `MsgUpdateOffer` and `MsgDeleteOffer` as needed.
  * User specifies price and expiration
    * Price will be transferred to module account as deposit.
      * On update offer, old deposit will be refunded and new deposit will be withdrawn
      * On delete offer, deposit will be refunded
    * Max offer duration is 180 days. When an offer is expired the chain will prune the record automatically. Users may call `MsgUpdateOffer` to extend the expiration.
  * Each user can only have one active offer for each NFT.
* NFT owner look for offers with `QueryOffersByNFTRequest` and call `MsgSellNFT` to sell.
  * Owner specifies the offer with class id, nft id and buyer address. Owner can specify a final price at or lower than the offered price.
    * If the final price is lower than the offered price, extra deposit will be refunded to the buyer.
  * Portion of the final price will be sent to royalty stakeholders according to the royalty config set by class owner.

## Object specifications

### ISCN-to-Class mapping

```protobuf
message ClassesByISCN {
  string iscn_id_prefix = 1; 
  repeated string class_ids = 2; 
}
```

* Array of `ClassId` is mapped for related NFT Classes

### Account-to-Class mapping

```protobuf
message ClassesByAccount {
  string account = 1; 
  repeated string class_ids = 2; 
}
message ClassesByAccountStoreRecord {
  bytes acc_address = 1 [(gogoproto.casttype) = "github.com/cosmos/cosmos-sdk/types.AccAddress"]; 
  repeated string class_ids = 2; 
}
```

* Account addresses are stored and indexed internally in bytes (`sdk.AccAddress`) form, while they are formatted in bech32 string for external interfaces.

### Class

> Extends ADR-43 Class object:
>
> ```protobuf
> message Class {
>   string id          = 1;
>   string name        = 2;
>   string symbol      = 3;
>   string description = 4;
>   string uri         = 5;
>   string uri_hash    = 6;
>   google.protobuf.Any data = 7;
> }
> ```

* `ID` field:
  * `SHA256(append(bytes(IscnIdPrefix) or AccAddress, bytes(string(Serial))))`, in Bech32 with `likenft` prefix.
    * `Serial` is the number of classes related to the parent
    * See [https://github.com/oursky/likecoin-chain/blob/feat/nft/x/likenft/types/class\_id.go](https://github.com/oursky/likecoin-chain/blob/feat/nft/x/likenft/types/class\_id.go) for implementation
  * e.g. `likenft12fre0mt7kzprlrnw7mc0e50gphcgr2zef88jwc7us7jgmx304g4smdde4v`
*   `Data` field:

    ```protobuf
    message ClassData {
      bytes metadata = 1 [
        (gogoproto.nullable) = false,
        (gogoproto.customtype) = "JsonInput"
      ];
      ClassParent parent = 2 [(gogoproto.nullable) = false];
      ClassConfig config = 3 [(gogoproto.nullable) = false];
      BlindBoxState blind_box_state = 4 [(gogoproto.nullable) = false];
    }

    // Parent Info
    message ClassParent {
      ClassParentType type = 1;
      string iscn_id_prefix = 2 [(gogoproto.nullable) = true];
      uint64 iscn_version_at_mint = 3 [(gogoproto.nullable) = true];
      string account = 4 [(gogoproto.nullable) = true];
    }

    enum ClassParentType {
      UNKNOWN = 0;
      ISCN = 1;
      ACCOUNT = 2;
    }

    // Configs
    message ClassConfig {
      bool burnable = 1;
      uint64 max_supply = 2;
      BlindBoxConfig blind_box_config = 3 [(gogoproto.nullable) = true];
    }

    // Blind Box feature
    message BlindBoxConfig {
      repeated MintPeriod mint_periods = 1 [(gogoproto.nullable) = false];
      google.protobuf.Timestamp reveal_time = 2 [(gogoproto.stdtime) = true, (gogoproto.nullable) = false];
    }

    message MintPeriod {
      google.protobuf.Timestamp start_time = 1 [(gogoproto.stdtime) = true, (gogoproto.nullable) = false];
      repeated string allowed_addresses = 2 ;
      uint64 mint_price = 3;
    }

    message BlindBoxState {
      uint64 content_count = 1;
      bool to_be_revealed = 2;
    }
    ```

    * No metadata standard is explicitly enforced. Users and dapp developers can take reference of the OpenSea standard: [https://docs.opensea.io/docs/contract-level-metadata](https://docs.opensea.io/docs/contract-level-metadata)
    * In `class_parent`, either ISCN fields or account will be filled, depending on the parent type.
      * `iscn_version_at_mint` is the latest ISCN version observed when the first token is minted for this class. Before minting, It will also be refreshed whenever user calls `UpdateClass`. It will be frozen after the first token is minted (in line with `UpdateClass`'s policy).
        * This is an extra datum to safeguard against the misuse of ISCN versioning. Generally speaking, users shall try to refer to the latest version of the ISCN when utilizing the Class’s / NFT’s metadata, since the ISCN prefix alone is expected to be representative of the registered content.
    * The blind box feature is enabled if `blind_box_config` is not empty
      * `mint_periods` allows flexible control of minting schedule, allowlisting and prices
        * When a user mints an unrevealed token, the earliest then cheapest mint period that allows the user will be applied
        * `allowed_addresses` being empty means any user is allowed
        * `start_time` must be later than current time and earlier than the `reveal_time`

### NFT Data

> Extends ADR-43 NFT object:
>
> ```protobuf
> message NFT {
>   string class_id           = 1;
>   string id                 = 2;
>   string uri                = 3;
>   string uri_hash           = 4;
>   google.protobuf.Any data  = 10;
> }
> ```

*   `Data` field:

    ```protobuf
    message NFTData {
      bytes metadata = 1 [
        (gogoproto.nullable) = false,
        (gogoproto.customtype) = "JsonInput"
      ];
      ClassParent class_parent = 2 [(gogoproto.nullable) = false];
      bool to_be_revealed = 3;
    }
    ```

    * No metadata standard is explicitly enforced. Users and dapp developers can take reference of the OpenSea standard: [https://docs.opensea.io/docs/metadata-standards](https://docs.opensea.io/docs/metadata-standards)
    * `class_parent` reflects the respective value in `Class` data.
      * Again, users shall try to refer to the latest version of the ISCN if possible when utilizing metadata stored here.
    * `to_be_revealed` denotes the class is blind box and the token content hasn’t been revealed yet.

### BlindBoxContent

```protobuf
message BlindBoxContent {
  string class_id = 1;
  string id = 2;
  NFTInput input = 3 [(gogoproto.nullable) = false];
}
```

* For Blind Box feature. Stores token content that will be assigned pseudo-randomly at reveal time.
* Note `id` is different from the final NFT token’s ID, which will be generated sequentially at mint time. This ID is scoped to the blind box content templates under the class.

### ClassRevealQueueEntry

```protobuf
message ClassRevealQueueEntry {
  google.protobuf.Timestamp reveal_time = 1 [(gogoproto.stdtime) = true, (gogoproto.nullable) = false]; 
  string class_id = 2; 
}
```

* Internal use only. For keeping a queue of class reveal schedule.
  * Similar to x/auth’s queue implementation, we process the reveal queue at EndBlocker, up to the current block header time.

### Royalty Config

```protobuf
message RoyaltyConfigByClass {
  string class_id = 1;
  RoyaltyConfig royalty_config = 2 [(gogoproto.nullable) = false];
}

message RoyaltyConfig {
  uint64 rate_basis_points = 1;
  repeated RoyaltyStakeholder stakeholders = 2 [(gogoproto.nullable) = false];
}

message RoyaltyStakeholder {
  bytes account = 1 [(gogoproto.casttype) = "github.com/cosmos/cosmos-sdk/types.AccAddress"];
  uint64 weight = 2;
}
```

* Rate basis points controls the amount of royalty that can be split from transaction amount.
  * Each basis point is 0.01%. e.g. 100 bps = 1%
  * Max rate is controlled by module param. Currently the max rate is 10%, or 1000 bps
  * Formula: `Allocatable Royalty = Floor(Float(Txn Amount) / 10000.0 * Float(Rate Bps))`
* The royalty amount rounded down to nanolike will be distributed according to the stakeholder list
  * For each stakeholder, the allocated royalty is computed according to the weight, and rounded down to nanolike
  * Formula: `Allocated Royalty = Floor(Float(Allocatable Royalty) / Float(Total Weights) * Float(Stakeholder Weight))`
* Rounding differences are transferred to the seller as part of the transaction net amount.

### Listing

```protobuf
message Listing {
  string class_id = 1;
  string nft_id = 2;
  string seller = 3;
  uint64 price = 4;
  google.protobuf.Timestamp expiration = 5 [
    (gogoproto.stdtime) = true,
    (gogoproto.nullable) = false
  ];
}

message ListingStoreRecord {
  string class_id = 1;
  string nft_id = 2;
  bytes seller = 3 [(gogoproto.casttype) = "github.com/cosmos/cosmos-sdk/types.AccAddress"];
  uint64 price = 4;
  google.protobuf.Timestamp expiration = 5 [
    (gogoproto.stdtime) = true,
    (gogoproto.nullable) = false
  ];
}
```

* Listing in Marketplace feature. Created by NFT owner / seller.
* Seller address indexed and stored in bytes (`sdk.AccAddress`) form, and formatted in bech32 string for external usages.

### ListingExpireQueueEntry

```protobuf
message ListingExpireQueueEntry {
  google.protobuf.Timestamp expire_time = 1 [
    (gogoproto.stdtime) = true,
    (gogoproto.nullable) = false
  ];
  bytes listing_key = 2;
}
```

* Internal use only. For keeping a queue of listing expire schedule.
  * Queue is processed at EndBlocker, up to the current block header time.

### Offer

```protobuf
message Offer {
  string class_id = 1;
  string nft_id = 2;
  string buyer = 3;
  uint64 price = 4;
  google.protobuf.Timestamp expiration = 5 [
    (gogoproto.stdtime) = true,
    (gogoproto.nullable) = false
  ];
}

message OfferStoreRecord {
  string class_id = 1;
  string nft_id = 2;
  bytes buyer = 3 [(gogoproto.casttype) = "github.com/cosmos/cosmos-sdk/types.AccAddress"];
  uint64 price = 4;
  google.protobuf.Timestamp expiration = 5 [
    (gogoproto.stdtime) = true,
    (gogoproto.nullable) = false
  ];
}
```

* Offer in Marketplace feature. Created by general users / buyer.
* Buyer address indexed and stored in bytes (`sdk.AccAddress`) form, and formatted in bech32 string for external usages.

### OfferExpireQueueEntry

```protobuf
message OfferExpireQueueEntry {
  google.protobuf.Timestamp expire_time = 1 [
    (gogoproto.stdtime) = true,
    (gogoproto.nullable) = false
  ];
  bytes offer_key = 2;
}
```

* Internal use only. For keeping a queue of offer expire schedule.
  * Queue is processed at EndBlocker, up to the current block header time.

## Query Specifications

* List of available queries
  * **ClassesByISCN**
    * Paginated query of Classes under an ISCN ID Prefix
  * **ClassesByISCNIndex**
    * Index of all ISCN ID prefix to Class IDs relations. Does not return concrete content of the Classes.
  * **ISCNByClass**
    * Validates relation and resolves parent ISCN record of the Class
  * **ClassesByAccount**
    * Paginated query of Classes under an account
  * **ClassesByAccountIndex**
    * Index of all account to Class IDs relations. Does not return concrete content of the Classes.
  * **AccountByClass**
    * Validates relation and resolves parent account of the Class
  * **BlindBoxContents**
    * Paginated query of Blind Box Content for a Blind Box enabled Class
  * **BlindBoxContent**
    * Resolves content of a specific Blind Box Content
  * **BlindBoxContentIndex**
    * Index of all Blind Box Content across all Classes
  * **ListingsByClass**
    * Paginated query of Listings to sell NFTs under a class
  * **ListingsByNFT**
    * Paginated query of Listings to sell a NFT
  * **Listing**
    * Resolves a specific Listing
  * **ListingIndex**
    * Index of all Listings
  * **OffersByClass**
    * Paginated query of Offers to buy NFTs under a class
  * **OffersByNFT**
    * Paginated query of Offers to buy a NFT
  * **Offer**
    * Resolves a specific Offer
  * **OfferIndex**
    * Index of all Offers
  * **RoyaltyConfig**
    * Resolves royalty config for a class
  * **RoyaltyConfigIndex**
    * Index of all royalty configs
* Refer to the proto file for details: [https://github.com/oursky/likecoin-chain/blob/feat/nft/proto/likechain/likenft/query.proto](https://github.com/oursky/likecoin-chain/blob/feat/nft/proto/likechain/likenft/query.proto)

### Class / NFT related queries

* Provided by x/nft, refer to ADR-43: [https://github.com/cosmos/cosmos-sdk/blob/master/docs/architecture/adr-043-nft-module.md#msg-service](https://github.com/cosmos/cosmos-sdk/blob/master/docs/architecture/adr-043-nft-module.md#msg-service)

## Mutation Specifications

### NewClass

```protobuf
rpc NewClass(MsgNewClass) returns (MsgNewClassResponse);
message MsgNewClass {
  string creator = 1;
  ClassParentInput parent = 2 [(gogoproto.nullable) = false];
  ClassInput input = 3 [(gogoproto.nullable) = false];
}
message ClassInput {
  string name = 1;
  string symbol = 2;
  string description = 3;
  string uri = 4;
  string uri_hash = 5;
  bytes metadata = 6 [
    (gogoproto.nullable) = false,
    (gogoproto.customtype) = "JsonInput"
  ];
  ClassConfig config = 7 [(gogoproto.nullable) = false];
}
message ClassParentInput {
  ClassParentType type = 1;
  string iscn_id_prefix = 2 [(gogoproto.nullable) = true];
  // for account, infers to use message sender's address
}
message MsgNewClassResponse {
  cosmos.nft.v1beta1.Class class = 1 [(gogoproto.nullable) = false];
}
```

* User must be owner of the ISCN record if one is used

### UpdateClass

```protobuf
rpc UpdateClass(MsgUpdateClass) returns (MsgUpdateClassResponse);
message MsgUpdateClass {
  string creator = 1;
  string class_id = 2;
  ClassInput input = 3 [(gogoproto.nullable) = false];
}
message MsgUpdateClassResponse {
  cosmos.nft.v1beta1.Class class = 1 [(gogoproto.nullable) = false];
}
```

* User must be owner of the ISCN record if one is used
* This method can only be called when there is no tokens minted. After token minting users are not permitted to make changes to the class unless they burn all existing tokens. In other words, it is impossible to update class if it has been transferred or sold to other users.

### MintNFT

```protobuf
rpc MintNFT(MsgMintNFT) returns (MsgMintNFTResponse);
message MsgMintNFT {
  string creator = 1;
  string class_id = 2;
  string id = 3;
  NFTInput input = 4 [(gogoproto.nullable) = true];
}
message NFTInput {
  string uri = 1;
  string uri_hash = 2;
  bytes metadata = 3 [
    (gogoproto.nullable) = false,
    (gogoproto.customtype) = "JsonInput"
  ];
}
message MsgMintNFTResponse {
  cosmos.nft.v1beta1.NFT nft = 1 [(gogoproto.nullable) = false];
}
```

* If Blind Box is not enabled, only the owner of the class parent is allowed to mint NFT. The `input` field is required.
* If Blind Box is enabled and it is during mint period, allowed users can mint according to the configured stages. Fees will be deducted and paid to the owner of the class parent. The `id` and `input` field is ignored even if supplied, a sequential token id will be generated.
* Note that currently x/nft requires the id to start with a letter and have at least 3 characters, which was not specified in the ADR, regex is `[a-zA-Z][a-zA-Z0-9/:-]{2,100}`

### BurnNFT

```protobuf
rpc BurnNFT(MsgBurnNFT) returns (MsgBurnNFTResponse);
message MsgBurnNFT {
  string creator = 1;
  string class_id = 2;
  string nft_id = 3;
}
message MsgBurnNFTResponse {
}
```

* User must be owner of the NFT
* The `burnable` flag must be true at the Class config

### SendNFT

* Provided by x/nft, refer to ADR-43: [https://github.com/cosmos/cosmos-sdk/blob/master/docs/architecture/adr-043-nft-module.md#msg-service](https://github.com/cosmos/cosmos-sdk/blob/master/docs/architecture/adr-043-nft-module.md#msg-service)

### CreateBlindBoxContent

```protobuf
rpc CreateBlindBoxContent(MsgCreateBlindBoxContent) returns (MsgCreateBlindBoxContentResponse);
message MsgCreateBlindBoxContent {
  string creator = 1;
  string class_id = 2;
  string id = 3;
  NFTInput input = 4 [(gogoproto.nullable) = false];
}
message MsgCreateBlindBoxContentResponse {
  BlindBoxContent blind_box_content = 1 [(gogoproto.nullable) = false];
}
```

* Changes to the blind box content templates are only allowed before the first token is minted (same as `UpdateClass`)
* Note the `id` is independent from the final minted token ID. It is scoped to the blind box contents under the class only.

### UpdateBlindBoxContent

```protobuf
rpc UpdateBlindBoxContent(MsgUpdateBlindBoxContent) returns (MsgUpdateBlindBoxContentResponse);
message MsgUpdateBlindBoxContent {
  string creator = 1;
  string class_id = 2;
  string id = 3;
  NFTInput input = 4 [(gogoproto.nullable) = false];
}
message MsgUpdateBlindBoxContentResponse {
  BlindBoxContent blind_box_content = 1 [(gogoproto.nullable) = false];
}
```

* Same notes as above

#### DeleteBlindBoxContent

```protobuf
rpc DeleteBlindBoxContent(MsgDeleteBlindBoxContent) returns (MsgDeleteBlindBoxContentResponse);
message MsgDeleteBlindBoxContent {
  string creator = 1;
  string class_id = 2;
  string id = 3;
}
message MsgDeleteBlindBoxContentResponse {
}
```

* Same notes as above

### CreateRoyaltyConfig

```protobuf
rpc CreateRoyaltyConfig(MsgCreateRoyaltyConfig) returns (MsgCreateRoyaltyConfigResponse);
message MsgCreateRoyaltyConfig {
  string creator = 1;
  string class_id = 2;
  RoyaltyConfigInput royalty_config = 3 [(gogoproto.nullable) = false];
}
message RoyaltyConfigInput {
  uint64 rate_basis_points = 1;
  repeated RoyaltyStakeholderInput stakeholders = 2 [(gogoproto.nullable) = false];
}
message RoyaltyStakeholderInput {
  string account = 1;
  uint64 weight = 2;
}
message MsgCreateRoyaltyConfigResponse {
  RoyaltyConfig royalty_config = 1 [(gogoproto.nullable) = false];
}
```

* User must be the class owner
* Royalty config can be changed on-the-fly, even after minting of the first token.
* Each basis point is 0.01%. e.g. 100 bps = 1%.
* Rate basis points must be less than or equal to the max rate defined in module param. Current max is 1000 bps or 10%.
* Stakeholder account is bech32 encoded address of the recipient account.
* Royalty split is computed by the rate of stakeholder weight / total weight. The sum of all weights are not restricted.

### UpdateRoyaltyConfig

```protobuf
rpc UpdateRoyaltyConfig(MsgUpdateRoyaltyConfig) returns (MsgUpdateRoyaltyConfigResponse);
message MsgUpdateRoyaltyConfig {
  string creator = 1;
  string class_id = 2;
  RoyaltyConfigInput royalty_config = 3 [(gogoproto.nullable) = false];
}
message MsgUpdateRoyaltyConfigResponse {
  RoyaltyConfig royalty_config = 1 [(gogoproto.nullable) = false];
}
```

* Same notes as above

### DeleteRoyaltyConfig

```protobuf
rpc DeleteRoyaltyConfig(MsgDeleteRoyaltyConfig) returns (MsgDeleteRoyaltyConfigResponse);
message MsgDeleteRoyaltyConfig {
  string creator = 1;
  string class_id = 2;
}
message MsgDeleteRoyaltyConfigResponse {}
```

* Same notes as above

### CreateListing

```protobuf
rpc CreateListing(MsgCreateListing) returns (MsgCreateListingResponse);
message MsgCreateListing {
  string creator = 1;
  string class_id = 2;
  string nft_id = 3;
  uint64 price = 4;
  google.protobuf.Timestamp expiration = 5 [
    (gogoproto.stdtime) = true,
    (gogoproto.nullable) = false
  ];
}
message MsgCreateListingResponse {
  Listing listing = 1 [(gogoproto.nullable) = false];
}
```

* User must be current owner of the NFT
* Max expiration range is 180 days
* On successful creation, listings by previous owners will be removed

### UpdateListing

```protobuf
rpc UpdateListing(MsgUpdateListing) returns (MsgUpdateListingResponse);
message MsgUpdateListing {
  string creator = 1;
  string class_id = 2;
  string nft_id = 3;
  uint64 price = 4;
  google.protobuf.Timestamp expiration = 5 [
    (gogoproto.stdtime) = true,
    (gogoproto.nullable) = false
  ];
}
message MsgUpdateListingResponse {
  Listing listing = 1 [(gogoproto.nullable) = false];
}
```

* Users can use this method to update listed price and extend the listing expiration

### DeleteListing

```protobuf
rpc DeleteListing(MsgDeleteListing) returns (MsgDeleteListingResponse);
message MsgDeleteListing {
  string creator = 1;
  string class_id = 2;
  string nft_id = 3;
}
message MsgDeleteListingResponse {}
```

* User can use this method to delete their own listing
* After transfer NFT via x/nft, new owner can use this method to delete listings by previous owners without creating new listing

### BuyNFT

```protobuf
rpc BuyNFT(MsgBuyNFT) returns (MsgBuyNFTResponse);
message MsgBuyNFT {
  string creator = 1;
  string class_id = 2;
  string nft_id = 3;
  string seller = 4;
  uint64 price = 5;
}
message MsgBuyNFTResponse {}
```

* User can use this to buy a listed NFT
* Before sending transaction, frontend or user should verify that the listing is by the current owner of the NFT via x/nft `QueryOwnerRequest` to save gas fee in case of invalid listing
  * The module actively remove invalid listings at successful trades, new listing creation and scheduled listing expirations.
  * However, it is possible for a NFT owner to transfer the token via x/nft directly, causing invalid listings to be kept in module state.
* User can specify a final price at or higher than the listed price

### CreateOffer

```protobuf
rpc CreateOffer(MsgCreateOffer) returns (MsgCreateOfferResponse);
message MsgCreateOffer {
  string creator = 1;
  string class_id = 2;
  string nft_id = 3;
  uint64 price = 4;
  google.protobuf.Timestamp expiration = 5 [
    (gogoproto.stdtime) = true,
    (gogoproto.nullable) = false
  ];
}
message MsgCreateOfferResponse {
  Offer offer = 1 [(gogoproto.nullable) = false];
}
```

* Any user can user this method to create offer for a NFT
* Max expiration range is 180 days
* Price amount is transferred from user to module account as deposit. It will be refunded on expiration or deletion

### UpdateOffer

```protobuf
rpc UpdateOffer(MsgUpdateOffer) returns (MsgUpdateOfferResponse);
message MsgUpdateOffer {
  string creator = 1;
  string class_id = 2;
  string nft_id = 3;
  uint64 price = 4;
  google.protobuf.Timestamp expiration = 5 [
    (gogoproto.stdtime) = true,
    (gogoproto.nullable) = false
  ];
}
message MsgUpdateOfferResponse {
  Offer offer = 1 [(gogoproto.nullable) = false];
}
```

* User can use this method to update the offered price or extend the expiration
* On price change, the old deposit is refunded and new deposit is taken

### DeleteOffer

```protobuf
rpc DeleteOffer(MsgDeleteOffer) returns (MsgDeleteOfferResponse);
message MsgDeleteOffer {
  string creator = 1;
  string class_id = 2;
  string nft_id = 3;
}
message MsgDeleteOfferResponse {}
```

* User can use this method to delete their own offer
* Deposit will be refunded

### SellNFT

```protobuf
rpc SellNFT(MsgSellNFT) returns (MsgSellNFTResponse);
message MsgSellNFT {
  string creator = 1;
  string class_id = 2;
  string nft_id = 3;
  string buyer = 4;
  uint64 price = 5;
}
message MsgSellNFTResponse {}
```

* NFT owner can use this method to accept an offer
* NFT owner can specify a final price at or lower than the offered price. Any remaining deposit will be refunded.

## Event Specifications

* Please refer to [https://github.com/oursky/likecoin-chain/blob/feat/nft/proto/likenft/event.proto](https://github.com/oursky/likecoin-chain/blob/feat/nft/proto/likenft/event.proto)
* These are in addition to x/nft’s own events

## Module Parameters

```protobuf
message Params {
  option (gogoproto.goproto_stringer) = false;

  string price_denom = 1;
  cosmos.base.v1beta1.DecCoin fee_per_byte = 2 [
     (gogoproto.nullable) = false
  ];
  uint64 max_offer_duration_days = 3;
  uint64 max_listing_duration_days = 4;
  uint64 max_royalty_basis_points = 5;
}
```

* To combat denial of service attacks, we will charge gas fee based on size of metadata uploaded.
  * Gas fee is applicable to Class data and NFT data
    * For Class data, gas fee will be charged at class create / update time
    * For NFT data, gas fee will be charged at mint time for simple mint, or at content create / update time for blind box mint.
* Default max offer duration and listing duration is 180 days. Valid range is \[1, inf)
* Default max royalty basis points is 1000 (10%). Valid range is \[0, 10000]

## Rollout Plan

We are shipping the initial release of the module with v3.0.0 StarFerry upgrade, which is based on Cosmos SDK v0.45. The x/nft module being shipped is backported from Cosmos SDK 0.46-rc1.

We will introduce another chain upgrade to adopt Cosmos SDK v0.46 when it is officially released. We also plan to add enhancements such as x/authz support, which will allow DApps to act on users’ behalf to manage Classes and NFTs.