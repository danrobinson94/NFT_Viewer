import ABI from "./DazABI.js";
import genericABI from "./genericABI.js";

let contract;
let abiFile;
let contractAddress;

// Function to add html elements such as token ID's
const addHtml = (inputDiv, type, selector, tag, html) => {
  const newItem = document.createElement(type);
  newItem.setAttribute(selector, tag);
  newItem.innerHTML = html;
  inputDiv.appendChild(newItem);
};

// Function to change the ABI file and contract address used with each collection that the user can select
const setCollection = (collection) => {
  if (collection === "Daz3D") {
    abiFile = ABI;
    contractAddress = "0x63e0EAb409F1C1e737aAD225003D709b57dBe9E5";
  }
  if (collection === "NFPets - Sparky") {
    abiFile = ABI;
    contractAddress = "0xf34893e893be01015e7c1f533075135785e9470e";
  }
  if (
    collection === "Champion X NFP" ||
    collection === "Non-Fungible People" ||
    collection === "NFPets"
  ) {
    abiFile = genericABI;
  }
  if (collection === "Champion X NFP") {
    contractAddress = "0xfed364dd70217782b01971d6c3993d99663ec239";
  }
  if (collection === "Non-Fungible People") {
    contractAddress = "0x92133E21FFF525B16d1eDcF78be82297D25D1154";
  }
  if (collection === "NFPets") {
    contractAddress = "0xd000773d474b838517302427e015e84c2d869044";
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  // Create new web3 instance
  const web3 = new Web3(window.ethereum);
  // Get input from user
  let collection = await document.getElementById("project").value;
  let walletAddress = document.getElementById("wallet_address").value;
  // Listen when the user changes the selected collection
  document.getElementById("project").addEventListener("change", async () => {
    collection = document.getElementById("project").value;
    setCollection(collection);
  });
  // Listen when the user enters a new wallet address
  document
    .getElementById("wallet_address")
    .addEventListener("input", async () => {
      walletAddress = document.getElementById("wallet_address").value;
    });
  // Initial call of the setCollection function
  setCollection(collection);

  // Listen when user clicks "SHOW MY NFTS" button
  document.getElementById("load_button").addEventListener("click", async () => {
    // If we've listed any NFT images previously, remove them when we select a new collection
    const currentListedNFTs = document.querySelectorAll(".new-nft-div");
    for (let i = 0; i < currentListedNFTs.length; i++) {
      await currentListedNFTs[i].remove();
    }
    // New contract instance
    contract = await new web3.eth.Contract(abiFile, contractAddress);
    let methods = await contract.methods;
    let NFTBalance;
    let tokensOwned = 0;
    let tokenURIs = [];
    let tokenLinks = [];
    let tokensList = [];
    // Actions to complete if the selected collection was Daz3D
    if (collection === "Daz3D") {
      let ownsToken;
      // Loop through tokens 1 through 23, as listed in assessment requirements provided
      for (let i = 1; i < 24; i++) {
        // Call the balanceOf function in the contract, to see if the wallet address owns
        // any of tokens 1 - 23 (i)
        ownsToken = await methods.balanceOf(walletAddress, i).call({
          from: walletAddress,
        });
        // If (i) is owned by the user, the function returns "1", and we can call uri(i) to find a link
        // to the NFT's JSON file and push that to our array
        if (ownsToken === "1") {
          const newLink = await methods.uri(i).call();
          tokenURIs.push(newLink);
          tokensList.push(i);
          tokensOwned += Number(ownsToken);
        }
        NFTBalance = tokensOwned;
      }
    }
    // If collection selected was NFPets - Sparky, check if the user owns one of the tokens.
    if (collection === "NFPets - Sparky") {
      NFTBalance = await methods.balanceOf(walletAddress, 1).call({
        from: walletAddress,
      });
      // Since it's an ERC1155, the only token ID we will check in balanceOf is "1", and "1" is the only token
      // ID we will pass to our tokensList
      if (NFTBalance === "1") {
        tokensList.push(1);
      }
    }
    // If it's one of the remaining collections, process is similar to NFPets - Sparky but we
    // can check the tokenID owned by the user with tokenOfOwnerByIndex, and push the tokens
    // owned by the user to our tokensList
    if (
      collection === "NFPets" ||
      collection === "Champion X NFP" ||
      collection === "Non-Fungible People"
    ) {
      NFTBalance = await methods.balanceOf(walletAddress).call();
      for (let i = 0; i < NFTBalance; i++) {
        const tokenId = await methods
          .tokenOfOwnerByIndex(walletAddress, i)
          .call();
        tokensList.push(tokenId);
      }
    }
    // Check to see if we have listed the collection name and token quantity to the user already
    const currentCollectionName = document.getElementById("collection-title");
    const currentCollectionQuantity = document.getElementById(
      "collection-quantity"
    );
    const currentCollectionIds = document.querySelectorAll(".collection-token");
    const inputDiv = document.getElementById("input-div");
    // If we've laready displayed the name and quantity to the user, update them with values from the latest
    // collection that the user queried for
    if (currentCollectionName !== null && NFTBalance) {
      currentCollectionName.innerHTML = `<p>Collection: ${collection}</p>`;
      currentCollectionQuantity.innerHTML = `<p>NFT's owned: ${NFTBalance}</p>`;
      // If we have any previous tokenID's listed, remove them so we can replace with new ones
      for (let i = 0; i < currentCollectionIds.length; i++) {
        await currentCollectionIds[i].remove();
      }
      // Loop through our tokensList and call our addHtml function to add token numbers to our list
      for (let i = 0; i < tokensList.length; i++) {
        addHtml(
          inputDiv,
          "div",
          "class",
          "collection-token",
          `<p>${tokensList[i]}</p>`
        );
      }
      // If this is our first query and there are is no previous collection info on the page,
      // We add new html elements to the page
    } else if (NFTBalance) {
      addHtml(
        inputDiv,
        "div",
        "id",
        "collection-title",
        `<p>Collection: ${collection}</p>`
      );
      addHtml(
        inputDiv,
        "div",
        "id",
        "collection-quantity",
        `<p>Total Tokens Owned: ${NFTBalance}</p>`
      );
      addHtml(inputDiv, "div", "id", "quantity-title", "<p>Token ID's:</p>");
      for (let i = 0; i < tokensList.length; i++) {
        addHtml(
          inputDiv,
          "div",
          "class",
          "collection-token",
          `<p>${tokensList[i]}</p>`
        );
      }
    }
    // If the collection was Daz3D, we can use the token's JSON file to provide the user with
    // token name and image data, and let them click the image to see the token on rarible.com
    if (collection === "Daz3D") {
      for (let i = 0; i < tokensOwned; i++) {
        // Loop through the tokenURIs to clean up the URL
        if (tokenURIs[i].startsWith("ipfs://")) {
          tokenLinks.push(
            `https://ipfs.io/${tokenURIs[i].split("ipfs://")[1]}`
          );
        }
        // Go fetch the text from the JSON file
        const html = await (await fetch(tokenLinks[i])).text();
        // parse the html
        const newJson = JSON.parse(html);
        // create a link we'll use to populate the image for the user
        const nftImage = `https://ipfs.io/${newJson.image.replace(
          "ipfs://",
          ""
        )}`;
        const nftName = newJson.name;
        const nftUrl = newJson.external_url;
        // Create new instance of our html template element and populate it with the JSON data
        const newNFT = document
          .getElementById("nft_template")
          .content.cloneNode(true);
        newNFT.querySelector("div").setAttribute("class", "new-nft-div");
        newNFT.querySelector("h1").innerText = nftName;
        newNFT.querySelector("a").href = nftUrl;
        newNFT.querySelector("img").src = nftImage;
        await document.getElementById("nfts").append(newNFT);
      }
    }
  });
});
