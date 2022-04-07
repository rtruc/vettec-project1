// All images should be sized appropriately and have alternative text displayed should the image fail to render
let images;
let currentlyZoomedImage;

function buildPhotoGallery() {
    
    filePaths = [
        ['./img/staging/Training/', 'Training.csv'],
        ['./img/staging/Training/', 'Training.csv']
    ]

    for(let filePath of filePaths) {
        fetchCSVFileAndBuildGallerySection(...filePath);
    }
}

function fetchCSVFileAndBuildGallerySection(filePath, fileName) {
    fetch(filePath + fileName)
        .then(response => response.text())
        .then(responseText => parseCSVPhotoData(responseText))
        // .then(parsedStrings => console.log(parsedStrings))
        .then(photoStrings => generatePhotoColumn(photoStrings, filePath))
        .then(photoSection => appendPhotoSectionToGallery(photoSection))
        // .then(enableClickToZoomOnImages())
        .catch(reason => console.log("Oh shit!" + reason));
}

function parseCSVPhotoData(csv){
    let photos = [];
    splitsStrings = csv.split(/\r?\n/);

    for(let entry of splitsStrings) {
        splits = entry.split(',');
        
        let photo = {};
        photo.fileName = splits[0].trim();
        photo.altText = splits[1].trim();
        photo.titleText = splits[2].trim();
        
        photos.push(photo);
    }

    return photos;
}


function appendPhotoSectionToGallery(photoSection) {
    let galleryDiv = document.getElementById('gallery');
    galleryDiv.appendChild(photoSection);
}

function generatePhotoColumn(photos, folder) {
    let columnDiv = document.createElement('div');
    columnDiv.classList.add('flex-column');

    console.log(photos);

    let rowMax = 3;
    let rowCount = 0;
    let rowPhotos = [];

    for(let i = 0; i < photos.length; i++) {
        rowPhotos.push(photos[i]);
        rowCount++;
        if(rowCount >= rowMax) {
            let photoRowDiv = generatePhotoRow(rowPhotos, folder);
            columnDiv.appendChild(photoRowDiv);

            rowPhotos = [];
            rowMax = rowMax == 3 ? 2 : 3;
            rowCount = 0;
        }
    }

    if (rowPhotos.length > 0) {
        let photoRowDiv = generatePhotoRow(rowPhotos, folder);
        columnDiv.appendChild(photoRowDiv);
    }

    console.log(columnDiv);
    return columnDiv;
}


function generatePhotoRow(photos, filePath) {
    let rowDiv = document.createElement('div');
    rowDiv.classList.add("flex-row");
    
    for (let photo of photos) {
        rowDiv.innerHTML += `<img class="gallery-img" 
                                  src="${filePath}${photo.fileName}" 
                                  alt="${photo.altText}" 
                                  title="${photo.titleText}"/>`;
    }

    return rowDiv;
}





function zoomImage() {
    // If image that was clicked on is already zoomed, unzoom and return   
    if (currentlyZoomedImage == this) {
        currentlyZoomedImage.classList.remove("zoom");
        currentlyZoomedImage = null;
        return;
    }

    // If a different image is zoomed, unzoom that image and then zoom
    // the image that was clicked on
    if (currentlyZoomedImage) {
        currentlyZoomedImage.classList.remove("zoom");
    }
    this.classList.add("zoom");
    currentlyZoomedImage = this;

    // How to center image?
}

function zoomeImageAlt() {
    // If image that was clicked on is already zoomed, unzoom and return   
    if (currentlyZoomedImage == this) {
        this.style.transform = null;
        setTimeout(() => this.style.zIndex = null, 50);
        // this.style.zIndex = null;
        currentlyZoomedImage = null;
        return;
    }

    // If a different image is zoomed, unzoom that image and then zoom
    // the image that was clicked on
    if (currentlyZoomedImage) {
        // setTimeout(() => currentlyZoomedImage.style.zIndex = null, 50);
        currentlyZoomedImage.style.transform = null;
        currentlyZoomedImage.style.zIndex = null;

    }

    let xScreen = window.innerWidth;
    let yScreen = window.innerHeight;

    // console.log("x: "+ xScreen + " y: " + yScreen);
    console.log(this.getBoundingClientRect());

    let boundingRect = this.getBoundingClientRect();
    let xDiv = boundingRect.x;
    let yDiv = boundingRect.y;
    let heightDiv = boundingRect.height;
    let widthDiv = boundingRect.width;

    let yTranslate = yScreen / 2 - yDiv - heightDiv / 2;
    let xTranslate = xScreen / 2 - xDiv - widthDiv / 2;

    let overscan = 100;
    let heightMultiplier = (yScreen - overscan )/ heightDiv;
    let widthMultiplier = (xScreen - overscan ) / widthDiv;
    let scaleMultiplier = heightMultiplier < widthMultiplier ? heightMultiplier : widthMultiplier;
    
    console.log("scale multi: " + scaleMultiplier);

    console.log("Screen Width:     " + xScreen);
    console.log("Image X Position: " + xDiv);
    console.log('');
    console.log("Screen Height:    " + yScreen);
    console.log("Image Y Position: " + yDiv);
    
    this.style.transform = `translate(${xTranslate}px,${yTranslate}px) scale(${scaleMultiplier}) `;

    this.style.zIndex = '5';

    currentlyZoomedImage = this;
}

function enableClickToZoomOnImages() {
    images = document.getElementsByClassName("gallery-img");
    for (let i = 0; i < images.length; i++) {
        images[i] = images[i].addEventListener('click', zoomeImageAlt);
    }
}


window.addEventListener('load', () => {

    buildPhotoGallery();

    //FIXME: 
    setTimeout(() => enableClickToZoomOnImages(), 1000);
})