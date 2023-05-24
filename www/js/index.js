document.addEventListener("deviceready", onDeviceReady, false);

const toggleModeBtn = document.getElementById("toggle_mode");
const timer = document.getElementById("timer");
const takePictureBtn = document.getElementById("snap");
const changeCameraBtn = document.getElementById("change_camera");
var camera_dir = "back";
let timerInterval;
var isRecording = false;

function onDeviceReady() {
    screen.orientation.lock("portrait");
    CameraPreview.startCamera({
        y: 80,
        width: document.getElementById("preview").clientWidth,
        height: document.getElementById("preview").clientHeight,
        camera: camera_dir,
        toBack: true,
        tapPhoto: false,
        tapFocus: true,
        previewDrag: true,
        storeToFile: false,
        disableExifHeaderStripping: false,
    });

    takePictureBtn.addEventListener("click", function () {
        if (toggleModeBtn.checked) {
            // Режим відеозйомки
            if (isRecording) {
                // Остановить запись видео
                CameraPreview.stopRecordVideo(
                    function (filePath) {
                        console.log("Video saved:", filePath);
                        clearInterval(timerInterval); // Очищаем интервал при остановке записи
                        timer.style.display = "none"; // Скрываем таймер
                        changeCameraBtn.style.display = "flex";
                        document.getElementById("last_picture").style.display = "flex";
                        document.getElementById("camera_switch").style.display = "flex";
                        isRecording = false;

                        // Получение текущей даты и времени
                        var now = new Date();
                        var date = now.toISOString().split("T")[0].replace(/-/g, ""); // Преобразуем дату в формат "YYYYMMDD"
                        var time = now.toTimeString().split(" ")[0].replace(/:/g, ""); // Преобразуем время в формат "HHMMSS"

                        // Формирование нового имени файла
                        var newFileName = "VID_" + date + "_" + time + ".mp4";

                        // Сохранить видео в галерею с новым именем
                        window.resolveLocalFileSystemURL(
                            `file://` + filePath,
                            function (fileEntry) {
                                console.log("take path");
                                window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function (directoryEntry) {
                                    directoryEntry.getDirectory("DCIM/SimpleCamera", { create: true }, function (cameraDir) {
                                        fileEntry.moveTo(
                                            cameraDir,
                                            newFileName, // Новое имя файла
                                            function () {
                                                console.log("Video saved to gallery");
                                            },
                                            function (error) {
                                                console.log("Error moving video to gallery:", error);
                                            },
                                        );
                                    });
                                });
                            },
                            function (error) {
                                console.log("Error moving video to gallery:", error);
                            },
                        );
                    },
                    function (error) {
                        console.log("Error starting video recording:", error);
                        isRecording = false;
                    },
                );
            } else {
                // Начать запись видео

                var opts = {
                    cameraDirection: camera_dir,
                    width: document.getElementById("preview").clientWidth,
                    height: document.getElementById("preview").clientHeight,
                    quality: 100,
                    withFlash: false,
                };

                CameraPreview.startRecordVideo(
                    opts,
                    function (filePath) {
                        console.log("Video recording started");
                        startTimer(); // Запускаем таймер при начале записи
                        timer.style.display = "flex"; // Отображаем таймер
                        changeCameraBtn.style.display = "none";
                        document.getElementById("last_picture").style.display = "none";
                        document.getElementById("camera_switch").style.display = "none";
                        isRecording = true;
                    },
                    function (error) {
                        console.log("Error starting video recording:", error);
                        isRecording = true;
                    },
                );
            }
        } else {
            // Сделать фото
            CameraPreview.takePicture(
                { quality: 100 },
                function (base64PictureData) {
                    navigator.geolocation.getCurrentPosition(
                        function (position) {
                            window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function (directoryEntry) {
                                directoryEntry.getDirectory("DCIM/SimpleCamera", { create: true }, function (cameraDir) {
                                    var fileName = "IMG_" + Date.now() + ".jpg";
                                    cameraDir.getFile(fileName, { create: true }, function (file) {
                                        file.createWriter(function (fileWriter) {
                                            fileWriter.onwriteend = function () {
                                                console.log("Picture saved to gallery");
                                            };
                                            fileWriter.onerror = function (e) {
                                                console.log("Failed to save picture: " + e.toString());
                                            };
                                            var fileData = window.atob(base64PictureData);
                                            var byteArray = new Uint8Array(fileData.length);
                                            for (var i = 0; i < fileData.length; i++) {
                                                byteArray[i] = fileData.charCodeAt(i);
                                            }
                                            var blob = new Blob([byteArray], { type: "image/jpeg" });

                                            // Добавить метаданные о местоположении
                                            var metadata = {
                                                location: {
                                                    latitude: position.coords.latitude,
                                                    longitude: position.coords.longitude,
                                                },
                                            };
                                            var blobWithMetadata = new Blob([blob, JSON.stringify(metadata)], { type: "image/jpeg" });
                                            fileWriter.write(blobWithMetadata);
                                        });
                                    });
                                });
                            });
                        },
                        function (error) {
                            console.log("Error getting current position:", error);
                        },
                    );
                },
                function (error) {
                    console.log("Error taking picture:", error);
                },
            );
        }
    });

    function startTimer() {
        let seconds = 0;
        timer.textContent = formatTime(seconds);

        timerInterval = setInterval(function () {
            seconds++;
            timer.textContent = formatTime(seconds);
        }, 1000);
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${padZero(minutes)}:${padZero(remainingSeconds)}`;
    }

    function padZero(number) {
        return String(number).padStart(2, "0");
    }

    changeCameraBtn.addEventListener("click", function () {
        CameraPreview.switchCamera();
        if (camera_dir == "back") {
            camera_dir = "front";
        } else if (camera_dir == "front") {
            camera_dir = "back";
        }
    });
}
