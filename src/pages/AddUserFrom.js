import { useState } from "react";

function AddUserFrom() {
  const [initialValues, setInitialValues] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    positon: "",
    authority: "",
  });

  // return (
  //   <div>
  //     <h2>New User</h2>
  //     <Formik
  //       initialValues={initialValues}
  //       enableReinitialize={true}
  //       validationSchema={Yup.object({
  //         name: Yup.string().required("Required"),
  //         email: Yup.string().required("Required"),
  //         password: Yup.string().required("Required"),
  //         phone: Yup.number().required("Required"),
  //         positon: Yup.string().required("Required"),
  //         authority: Yup.string().required("Required"),
  //       })}
  //       onSubmit={(values, { setSubmitting }) => {
  //         const userData = values;

  //         axios
  //           .post("http://localhost:5000/api/users", scheduleData)
  //           .then(() => {
  //             alert("등록이 완료되었습니다.");
  //             navigate("/");
  //           })
  //           .catch((error) => {
  //             console.error(
  //               "There was an error saving the schedule!",
  //               error.message
  //             );
  //             setSubmitting(false);
  //           });
  //       }}
  //     >
  //       {({ isSubmitting }) => (
  //         <Form>
  //           {/* <div role="group" aria-labelledby="my-radio-group">
  //             <label>
  //               <Field type="radio" name="picked" value="meeting" />
  //               미팅
  //             </label>
  //             <label>
  //               <Field type="radio" name="picked" value="project" />
  //               프로젝트
  //             </label>

  //           </div> */}
  //           <div>
  //             <label htmlFor="title">일정명</label>
  //             <Field type="text" name="title" />
  //             <ErrorMessage name="title" component="div" />
  //           </div>

  //           <div>
  //             <label htmlFor="start">시작일시</label>
  //             <Field type="datetime-local" name="start" />
  //             <ErrorMessage name="start" component="div" />
  //           </div>

  //           <div>
  //             <label htmlFor="end">종료일시</label>
  //             <Field type="datetime-local" name="end" />
  //             <ErrorMessage name="end" component="div" />
  //           </div>

  //           <div>
  //             <label htmlFor="attendees">참여자</label>
  //             <input
  //               type="text"
  //               placeholder="이름 또는 이메일을 입력하세요."
  //               onKeyUp={(e) => handleSearch(e.target.value)}
  //               onKeyDown={handleKeyDown}
  //               autoComplete="off"
  //             />
  //             <ul style={{ listStyleType: "none", padding: 0 }}>
  //               {filteredUsers.map((user, index) => (
  //                 <li
  //                   key={index}
  //                   id={`user-${index}`}
  //                   onClick={() => addRecipient(user)}
  //                   style={{
  //                     padding: "8px",
  //                     backgroundColor:
  //                       focusedIndex === index ? "#d3d3d3" : "transparent",
  //                     cursor: "pointer",
  //                   }}
  //                 >
  //                   {user.name} ({user.email})
  //                 </li>
  //               ))}
  //             </ul>
  //             <h3>Selected Recipients:</h3>
  //             <ul>
  //               {recipients
  //                 ? recipients.map((recipient, index) => (
  //                     <li key={index}>
  //                       {recipient.name} ({recipient.email})
  //                       <button
  //                         type="button"
  //                         onClick={() => removeRecipient(index)}
  //                       >
  //                         X
  //                       </button>
  //                     </li>
  //                   ))
  //                 : ""}
  //             </ul>
  //           </div>

  //           <div>
  //             <label htmlFor="notes">메모</label>
  //             <Field type="text" name="notes" />
  //             <ErrorMessage name="notes" component="div" />
  //           </div>

  //           <button type="submit" disabled={isSubmitting}>
  //             저장
  //           </button>
  //           <button type="button" onClick={() => navigate("/")}>
  //             취소
  //           </button>
  //         </Form>
  //       )}
  //     </Formik>
  //   </div>
  // );
  return "Add New User";
}

export default AddUserFrom;
