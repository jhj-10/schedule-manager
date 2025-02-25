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
