const thumbnailQuality = "thumbnail";
const zoomQuality = "large";
const splitStringOnCommasOutsideQuotes = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;

const listViewFlag = false;
let gallerySections = [];

let shadowBox;
let currentlyZoomedImage = null;
let isShowingMenu = false;

let dropdownMenu;


window.addEventListener('load', () => {

    if (document.getElementById('gallery')) {        
        shadowBox = document.getElementById('shadow-box');
        
        //
        let galleryRootDir = "./img/gallery/";
        let galleryCSV = "gallery.csv";
        buildPhotoGallery(galleryRootDir, galleryCSV);

        // IDENTIFY AND TAG DROPDOWN NAVIGATION MENU
        let dropdownButton = document.getElementById('dropdown');
        dropdownButton.addEventListener('mouseover', showDropdownMenu);
        dropdownButton.addEventListener('mouseout', hideDropdownMenu);


        dropdownMenu = document.getElementById("dropdown-menu");

        // DISMISS MENU OR PHOTO IF SHOWING WHEN WHITESPACE IS CLICKED
        document.addEventListener('click', whitespaceClicked);
    }
})




function buildPhotoGallery(galleryRootDir, galleryCSV) {
    fetch(galleryRootDir + galleryCSV)
        .then(response => response.text())
        .then(responseText => parseSectionCSV(responseText, galleryRootDir))
        .then(sectionData => buildPhotoGallerySections(sectionData))   
        .catch(reason => console.log("Oops in buildPhotoGallery!" + reason));
}

function buildPhotoGallerySections(sections) {
    let promises = []
    sections.forEach(section => {
        promises.push(fetchSectionContentListAndBuildGallerySection(section));
    })

    
    Promise.all(promises)
        .then(() => assembleSectionsInOrder())
        .then(() => enableClickToZoomOnImages())
        // .then(() => generateDropdownNavigationMenu())
        .catch(section => console.log(section + ' failed'));

    generateDropdownNavigationMenu(sections);
}

function fetchSectionContentListAndBuildGallerySection(section) {
    let path = `${section.rootDir}${section.sectionDir}/`;
    let fileName = `${section.sectionDir}.csv`;

    return (fetch(path + fileName)
        .then(response => response.text())
        .then(responseText => parsePhotosCSV(responseText))
        .then(photoParameters => generatePhotoSection(photoParameters, path, section))
        .then(photoSection => gallerySections.push(photoSection))
        .catch(reason => console.log("Oops!" + reason)))
}


function parseSectionCSV(csv, galleryRootDir) {
    let sections = [];
    let sectionNumber = 0;
    splitsStrings = csv.split(/\r?\n/);

    for (let entry of splitsStrings) {
        if (entry[0] && entry[0] != '#') {

            splits = entry.match(splitStringOnCommasOutsideQuotes);

            let section = {};
            section.rootDir = galleryRootDir;
            section.sectionDir = splits[0].trim();
            section.title = splits[1].trim();
            section.description = splits[2].trim();
            section.number = sectionNumber;
            sectionNumber++;

            sections.push(section);
        }
    }
    return sections;
}


function parsePhotosCSV(csv) {
    let photos = [];
    splitsStrings = csv.split(/\r?\n/);

    for (let entry of splitsStrings) {

        if (entry[0] && entry[0] != '#') {
            splits = entry.match(splitStringOnCommasOutsideQuotes);

            let photo = {};

            photo.fileName = splits[0].trim();
            photo.altText = splits[1].trim();
            photo.titleText = splits[2].trim();

            photos.push(photo);
        }
    }
    return photos;
}


function generatePhotoSection(photos, folder, section) {
    // BUILD COLUMN DIV TO HOLD THIS SECTION
    let columnDiv = document.createElement('div');
    columnDiv.classList.add('flex-column-gallery');
    columnDiv.id = `section${section.number}`;
    columnDiv.setAttribute('name', section.name);

    //GENERATE AND ATTACH HEADER HERE
    let sectionHeader = generateSectionHeader(section);
    columnDiv.appendChild(sectionHeader);
    let divider = document.createElement('hr');
    divider.classList.add('gallery-divider');
    columnDiv.appendChild(divider);


    // SPECIFIES NUMBER OF PHOTOS PER ROW, LOOPS OVER TO START WHEN END REACHED
    let layoutPattern;
    if (!listViewFlag) {
        layoutPattern = [3, 4, 3, 5];
    }
    else {
        // IF LIST VIEW FLAG PASSED, ONLY ONE PHOTO PER LINE
        layoutPattern = [1];
    }

    let rowCurrent = layoutPattern[0];
    let patternIndex = 0;
    let rowCount = 0;
    let rowPhotos = [];

    // PACKAGE PHOTOS INTO ARRAYS, PASS ARRAYS TO ROW GENERATION FUNCTION
    // APPEND RESULTS TO COLUMN, UPDATE ROW LAYOUT LOGIC FOR NEXT PASS
    for (let i = 0; i < photos.length; i++) {
        rowPhotos.push(photos[i]);
        rowCount++;
        if (rowCount == rowCurrent) {
            let photoRowDiv = generatePhotoRow(rowPhotos, folder);
            columnDiv.appendChild(photoRowDiv);

            rowPhotos = [];
            
            rowCurrent = patternIndex < (layoutPattern.length - 1) ? layoutPattern[++patternIndex] : 
                                                                     layoutPattern[patternIndex = 0];
            rowCount = 0;

            // TODO: Possibly insert row shaping logic here
        }
    }

    // GENERATE LAST ROW FOR ANY LEFTOVER PHOTOS
    if (rowPhotos.length > 0) {
        let photoRowDiv = generatePhotoRow(rowPhotos, folder);
        columnDiv.appendChild(photoRowDiv);
    }

    return columnDiv;
}

function assembleSectionsInOrder() {
    // SORT SECTIONS BY HTML ID
    // ID SET TO <SECTION NUMBER> WHEN CREATED
    gallerySections.sort((s1, s2) => {
        if (s1.id < s2.id) {
            return -1;
        }
        if (s1.id > s2.id) {
            return 1;
        }
        return 0;
    });

    for (let section of gallerySections) {
        appendPhotoSectionToGallery(section);
    }
}


// ATTACH ASSEMBLED SECTION TO MAIN GALLERY
function appendPhotoSectionToGallery(photoSection) {
    let galleryDiv = document.getElementById('gallery');
    galleryDiv.appendChild(photoSection);
}




function generateSectionHeader(section) {
    let rowDiv = document.createElement('div');
    rowDiv.classList.add("flex-row-gallery-header");

    rowDiv.innerHTML += `<h1 class="gallery-header">${section.title}</h1>`;
    rowDiv.innerHTML += `<p class="gallery-header-description">${section.description}</p>`;

    return rowDiv;
}


function generatePhotoRow(photos, filePath) {
    let rowDiv = document.createElement('div');
    rowDiv.classList.add("flex-row-gallery");

    for (let photo of photos) {
        let imageTag;

        //KNOWN GOOD PATH BEFORE ADDING TEXT BOXES
        // IF ONLY 1-2 IMAGES LEFT, ASSIGN SPECIAL CLASS SO NOT OVERSIZED
        if (photos.length == 1 || photos.length == 2) {
            imageTag = `<img class="gallery-img-${photos.length}" `;
        } else {
            imageTag = `<img class="gallery-img" `;
        }
        imageTag += `src="${filePath}${thumbnailQuality}/${photo.fileName}" 
                             alt="${photo.altText}" 
                             title="${photo.titleText}"/>`;


        // TODO: Attach invisible DIV here with photo caption to show when zoomed

        rowDiv.innerHTML += imageTag;

        if (listViewFlag) {
            let labelDiv = document.createElement('h4');
            labelDiv.innerText = photos[0].fileName;
            rowDiv.appendChild(labelDiv);
        }
    }
    return rowDiv;
}




function zoomImage(event) {

    // HIDE MENU IF IT IS SHOWING WHEN PHOTO CLICKED
    // if (isShowingMenu) {
    //     hideDropdownMenu();
    // }

    // STOP CLICKS PROPAGATING TO WHITE SPACE AND CANCELING ZOOM
    event.stopPropagation();

    // IF CURRENTLY ZOOMED IMAGE WAS CLICKED, UNZOOM AND RETURN   
    if (currentlyZoomedImage == this) {
        shadowBox.style.background = 'rgba(0, 0, 0, 0.0)';

        this.style.transform = null;

        // DELAY RESTING Z AXIS SO ZOOMED IMAGE DOESN'T 'POP' UNDERNEATH OTHER IMAGES
        setTimeout(() => this.style.zIndex = null, 50);

        // RETURN TO THUMBNAIL QUALITY
        this.src = this.src.replace(zoomQuality, thumbnailQuality);
        currentlyZoomedImage = null;
        return;
    }

    // DIFFERENT IMAGE IS CURRENTLY ZOOMED, UNZOOM THAT IMAGE BEFORE PRECEDING
    if (currentlyZoomedImage) {
        currentlyZoomedImage.style.transform = null;
        currentlyZoomedImage.style.zIndex = null;
        currentlyZoomedImage.src = currentlyZoomedImage.src.replace(zoomQuality, thumbnailQuality);
    }

    // RAISE ZOOMED IMAGE ABOVE OTHER IMAGES
    this.style.zIndex = '5';
    
    // TODO: ADD COMMENT BOX WHEN ZOOMING
    // let parent = this.parentElement;
    // console.log("this", this);
    // console.log("parent", parent);

    //CALCULATE CENTER OF SCREEN FOR IMAGE
    let screenX = window.innerWidth;
    let screenY = window.innerHeight;

    let boundingRect = this.getBoundingClientRect();
    let divX = boundingRect.x;
    let divY = boundingRect.y;
    let divHeight = boundingRect.height;
    let divWidth = boundingRect.width;

    let yTranslate = screenY / 2 - divY - divHeight / 2;
    let xTranslate = screenX / 2 - divX - divWidth / 2;

    let overscan = 100;
    let heightMultiplier = (screenY - overscan) / divHeight;
    let widthMultiplier = (screenX - overscan) / divWidth;
    let scaleMultiplier = heightMultiplier < widthMultiplier ? heightMultiplier : widthMultiplier;

    this.style.transform = `translate(${xTranslate}px,${yTranslate}px) scale(${scaleMultiplier}) `;

    // DEBUG INFO FOR CENTERING
    // console.log("scale multi: " + scaleMultiplier);
    // console.log("Screen Width:     " + xScreen);
    // console.log("Image X Position: " + xDiv);
    // console.log('');
    // console.log("Screen Height:    " + yScreen);
    // console.log("Image Y Position: " + yDiv);

    // USE HIGHER QUALITY IMAGE FOR ZOOM
    this.src = this.src.replace(thumbnailQuality, zoomQuality);

    shadowBox.style.background = 'rgba(0, 0, 0, 0.604)';
    currentlyZoomedImage = this;
}

function whitespaceClicked() {
    if (currentlyZoomedImage) {
        // setTimeout(() => currentlyZoomedImage.style.zIndex = null, 50);
        shadowBox.style.background = 'rgba(0, 0, 0, 0.0)';
        currentlyZoomedImage.style.transform = null;
        currentlyZoomedImage.style.zIndex = null;
        currentlyZoomedImage.src = currentlyZoomedImage.src.replace(zoomQuality, thumbnailQuality);
        currentlyZoomedImage = null;
    }

    if (isShowingMenu) {
        hideDropdownMenu();
    }

}

function enableClickToZoomOnImages() {
    let galleryImg = document.getElementsByClassName("gallery-img");
    let galleryImg1 = document.getElementsByClassName("gallery-img-1");
    let galleryImg2 = document.getElementsByClassName("gallery-img-2");

    let allGalleryImages = [].concat(Array.from(galleryImg))
                            .concat(Array.from(galleryImg1))
                            .concat(Array.from(galleryImg2));

    for (let img of allGalleryImages) {
        img.addEventListener('click', zoomImage);
    }
}


function hideDropdownMenu() {
    // ! FADE OUT ANIMATION WORKS BUT FADE IN DOES NOT... 
    // dropdownMenu.style.opacity = 0;
    // setTimeout(() => dropdownMenu.classList.remove("show-menu"), 250);
    
    dropdownMenu.classList.remove("show-menu")
    isShowingMenu = false;
}

function showDropdownMenu() {    
    // ! FADE OUT ANIMATION WORKS BUT FADE IN DOES NOT... 
    // dropdownMenu.style.opacity = 1;
    // setTimeout(() => dropdownMenu.classList.add("show-menu"), 250);

    dropdownMenu.classList.add("show-menu")
    isShowingMenu = true;
}

function generateDropdownNavigationMenu(sections) {
    const dropdownMenu = document.getElementById('dropdown-menu');
    // console.log("Dropdown menu ", dropdownMenu);

    for(let section of sections) {
        let menuItem = document.createElement('a');
        menuItem.classList.add('menu-button');
        menuItem.href = `#section${section.number}`;
        menuItem.innerText = section.title;

        dropdownMenu.appendChild(menuItem);
    }
}

