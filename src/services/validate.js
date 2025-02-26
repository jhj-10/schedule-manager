// 핸드폰번호 유효성검사
export function validatePhone(phone) {
  if (!phone) {
    return "핸드폰 번호를 입력하세요.";
  } else if (!/^01([0|1|6|7|8|9])([0-9]{7,8})$/.test(phone)) {
    return "유효하지 않은 핸드폰 번호입니다. 숫자만 입력하세요.";
  }
}

// 비밀번호 유효성검사
export function validatePassword(password, checkPassword) {
  if (!checkPassword) {
    return "비밀번호를 입력하세요.";
  } else if (password !== checkPassword) {
    return "비밀번호가 틀립니다.";
  }
}

// 비밀번호 비교 유효성 검사
export function validateChangePassword(password) {
  if (!password) {
    return "변경 할 비밀번호를 입력하세요.";
  } else if (!/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[\W_]).{8,}$/.test(password)) {
    return "숫자, 특수문자, 영문을 조합하여 8자 이상 입력하세요.";
  }
}

// Gmail 아이디 검증
export function validateGmail(gmail) {
  if (!gmail) {
    return "지메일 아이디를 입력하세요.";
  } else if (!/^[a-zA-Z0-9](\.?[a-zA-Z0-9_-]){5,29}$/.test(gmail)) {
    return "유효하지 않은 지메일 아이디입니다.";
  }
}

// 회사 계정 검증
export function validateAltumAccount(emailId, userList) {
  if (!emailId) {
    return "회사계정 이메일 아이디를 입력하세요.";
  } else {
    const checkEmailId = userList.find(
      (el) => el.email === `${emailId}@altumpartners.co.kr`
    );
    if (!/^[a-zA-Z0-9]{5,}$/.test(emailId)) {
      return "유효하지 않은 아이디입니다.";
    } else if (checkEmailId) {
      return "존재하는 이메일 아이디입니다.";
    }
  }
}

// 이름 검증
export function validateName(name) {
  if (!name) {
    return "이름을 입력하세요.";
  } else if (!/^(?:[가-힣]{2,}|[a-zA-Z]{2,})$/.test(name)) {
    return "이름을 확인하세요.";
  }
}

// 공휴일 날짜형식 검증
export function validateDate(date, lunarYn) {
  if (!date) {
    return "날짜를 입력하세요.";
  } else if (
    lunarYn === "Y" &&
    !/^(1[0-2]|[1-9])-(3[01]|[12][0-9]|[1-9])$/.test(date)
  ) {
    return "음력 공휴일이 맞는지 확인하세요.";
  } else if (
    lunarYn === "N" &&
    !/^(\d{4})-(1[0-2]|[1-9])-(3[01]|[12][0-9]|[1-9])$/.test(date)
  ) {
    return "유효하지 않은 날짜형식입니다. 년-월-일 형식으로 입력하세요.";
  }
}

// 대체공휴일 지정 검증
export function validateSubstituteHoliday(substitute) {
  if (substitute && !/^[가-힣, ]+$/.test(substitute)) {
    return "특수문자는 사용할 수 없습니다. 대체공휴일 지정일이 2개 이상인 경우 콤마(,)로 구분하여 작성하세요.(예> 토,일)";
  }
}
