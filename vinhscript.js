const NEXT_FETCH_TIME_KEY = "nextFetchTime";

var nextFetchTime = localStorage.getItem(NEXT_FETCH_TIME_KEY) || Date.now();

window.onload = function () {
    updateTimer();
};

window.onblur = function () {
    updateTimer();
};

var isCopyingUid = false;

document.addEventListener('copy', event => {
    if (isCopyingUid) {
        return;
    }

    event.preventDefault();

    let copyTxt = window.getSelection().toString();
    const copyright = 'Source: Đinh Duy Vinh';
    event.clipboardData.setData('text/plain', copyTxt + '\n\n' + copyright);
});

function updateTimer() {
    var currentTime = Date.now();
    var timeRemaining = Math.max(0, Math.ceil((nextFetchTime - currentTime) / 1000));

    if (timeRemaining > 0) {
        var minutes = Math.floor(timeRemaining / 60);
        var seconds = timeRemaining % 60;
        var timeRemainingText = `Đợi ${minutes} phút ${seconds} giây để lấy ID khác`;
        document.getElementById("getUidButton").textContent = timeRemainingText;
        document.getElementById("getUidButton").classList.add("btn-disabled");
        document.getElementById("getUidButton").disabled = true;
        setTimeout(updateTimer, 1000);
    } else {
        document.getElementById("getUidButton").textContent = "Lấy ID";
        document.getElementById("getUidButton").classList.remove("btn-disabled");
        document.getElementById("getUidButton").disabled = false;
    }
}

function getUid() {
    var currentTime = Date.now();
    var timeRemaining = Math.max(0, Math.ceil((nextFetchTime - currentTime) / 1000));

    if (timeRemaining > 0) {
        var minutes = Math.floor(timeRemaining / 60);
        var seconds = timeRemaining % 60;
        var timeRemainingText = `Đợi ${minutes} phút ${seconds} giây để lấy ID khác`;
        document.getElementById("coppy").value = timeRemainingText;
        showPopup("popupWait");
        return;
    }

    var facebookLink = document.getElementById("facebookLink").value;
    var resultArea = document.getElementById("coppy");
    var copyButton = document.getElementById("copy-btn");
    var checkButton = document.getElementById("check-btn");

    if (facebookLink.trim() !== "") {
        if (!facebookLink.startsWith("https://www.facebook.com/") && !facebookLink.startsWith("https://facebook.com/") && !facebookLink.startsWith("facebook.com/")) {
            resultArea.value = "Vui lòng nhập liên kết Facebook hợp lệ.";
            showPopup("popupError");
            return;
        }

        var regex = /(?:https?:\/\/|http:\/\/)?(?:www\.)?facebook\.com\/(?:profile\.php\?id=)?(\d+)&mibextid=/;
        var match = facebookLink.match(regex);

        if (match) {
            var userId = match[1];
            resultArea.value = userId;
            showPopup("popupSuccess");
            copyButton.disabled = false;
            checkButton.disabled = false;
            getUserInfo(userId);
            nextFetchTime = currentTime + 120000;
            localStorage.setItem(NEXT_FETCH_TIME_KEY, nextFetchTime);
            setTimeout(updateTimer, 1000);
            return;
        }

        if (facebookLink.startsWith("https://facebook.com/")) {
            facebookLink = facebookLink.replace("https://facebook.com/", "https://www.facebook.com/");
        }

        if (facebookLink.startsWith("facebook.com/")) {
            facebookLink = facebookLink.replace("facebook.com/", "https://www.facebook.com/");
        }

        if (facebookLink.startsWith("https://www.facebook.com/profile.php?id=")) {
            facebookLink = facebookLink.replace("https://www.facebook.com/profile.php?id=", "https://www.facebook.com/");
        }

        if (facebookLink.startsWith("https://m.facebook.com/")) {
            facebookLink = facebookLink.replace("https://m.facebook.com/", "https://www.facebook.com/");
        }

        if (facebookLink.startsWith("https://web.facebook.com/")) {
            facebookLink = facebookLink.replace("https://web.facebook.com/", "https://www.facebook.com/");
        }

        resultArea.style.backgroundColor = "#e8f0fd";
        resultArea.value = "Đang xử lý...";

        fetch(`getID.php?linkFB=${encodeURIComponent(facebookLink)}`)
            .then(response => response.json())
            .then(data => {
                if (data.id) {
                    resultArea.value = data.id;
                    showPopup("popupSuccess");
                    copyButton.disabled = false;
                    checkButton.disabled = false;
                    getUserInfo(data.id);
                    nextFetchTime = currentTime + 120000;
                    localStorage.setItem(NEXT_FETCH_TIME_KEY, nextFetchTime);
                    setTimeout(updateTimer, 1000);
                } else {
                    resultArea.value = "Link Facebook này không tồn tại.";
                    showPopup("popupError");
                    copyButton.disabled = true;
                    checkButton.disabled = true;
                }
                resultArea.style.backgroundColor = "";
            })
            .catch(error => {
                resultArea.value = "Lỗi khi tìm nạp ID";
                showPopup("popupError");
                copyButton.disabled = true;
                checkButton.disabled = true;
                resultArea.style.backgroundColor = "";
            });
    }
}

function getUserInfo(userId) {
    var userDetails = document.getElementById("userDetails");
    userDetails.innerHTML = '';
    fetch(`getInfo.php?id=${userId}`)
        .then(response => response.json())
        .then(data => {
            var resultArea = document.getElementById("coppy");
            var copyButton = document.getElementById("copy-btn");
            var checkButton = document.getElementById("check-btn");
            var userDetails = document.getElementById("userDetails");

            if (!data.result.error) {
                showPopup("popupSuccess");
                copyButton.disabled = false;
                checkButton.disabled = false;

                if (data.result.name) {
                    var verified = data.result.is_verified ? `${data.result.name} <i class="fas fa-check-circle" style="color: #3B82F6; font-size: 12px;"></i>` : data.result.name;

                    var genderDisplay = "";
                    if (data.result.gender === "male") {
                        genderDisplay = "Nam";
                    } else if (data.result.gender === "female") {
                        genderDisplay = "Nữ";
                    } else {
                        genderDisplay = "không xác định";
                    }

                    var followersDisplay = data.result.followers !== "không xác định" ? `${data.result.followers} người` : "không xác định";

                    userDetails.innerHTML = `
                        <p>─────────────</p>
                        <p><font color="#000000">Tên:</font> ${verified}</p>
                        <p><font color="#000000">Ngày tạo Acc:</font> ${data.result.created_time}</p>
                        <p><font color="#000000">Giới tính:</font> ${genderDisplay}</p>
                        <p><font color="#000000">Tình trạng:</font> ${data.result.relationship_status || "không xác định"}</p>
                        <p><font color="#000000">Quê quán:</font> ${data.result.hometown?.name || "không xác định"}</p>
                        <p><font color="#000000">Sinh sống:</font> ${data.result.location?.name || "không xác định"}</p>
                        <p><font color="#000000">Làm việc tại:</font> ${data.result.work && data.result.work.length > 0 ? data.result.work[0].employer.name : "không xác định"}</p>
                        <p><font color="#000000">Ngày sinh:</font> ${data.result.birthday || "không xác định"}</p>
                        <p><font color="#000000">Số Follow:</font> ${followersDisplay}</p>
                        <p><font color="#000000">Quốc gia:</font> ${data.result.locale || "không xác định"}</p>
                        <p><font color="#000000">Cập nhật lần cuối:</font> ${data.result.updated_time}</p>
                        <p><font color="#000000">Múi giờ:</font> GMT ${data.result.timezone}</p>
                    `;
                }
            }
        })
        .catch(error => {
            console.error("Lỗi khi gửi yêu cầu API:", error);
        });
}

function copyUid() {
    isCopyingUid = true;
    var uidInput = document.getElementById("coppy");
    var resultValue = uidInput.value;

    if (resultValue.trim() !== "" && resultValue !== "Đang xử lý...") {
        uidInput.select();
        document.execCommand("copy");
        hidePopup("popupSuccess");
        showPopup("popupCopySuccess");
    }
    isCopyingUid = false;
}

function checkProfile() {
    const uid = document.getElementById('coppy').value;
    if (uid && uid !== "Đang xử lý...") {
        window.open(`https://www.facebook.com/${uid}`);
    } else {
        alert('Vui lòng lấy ID trước khi kiểm tra.');
    }
}

function showPopup(popupId) {
    document.getElementById(popupId).style.display = "flex";

    setTimeout(function () {
        document.getElementById(popupId).style.display = "none";
    }, 5000);
}
function hidePopup(popupId) {
    document.getElementById(popupId).style.display = "none";
}