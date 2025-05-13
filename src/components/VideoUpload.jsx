import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Validation schema sử dụng Yup
const validationSchema = Yup.object({
  title: Yup.string().required("Tiêu đề là bắt buộc"),
  description: Yup.string().required("Mô tả là bắt buộc"),
  videoFile: Yup.mixed().required("Vui lòng chọn một video"),
});

function VideoUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const navigate = useNavigate();

  const initialValues = {
    title: "",
    description: "",
    videoFile: null,
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    const formData = new FormData();
    formData.append("file", values.videoFile);
    formData.append("title", values.title);
    formData.append("description", values.description);

    try {
      const response = await axios.post("http://localhost:8080/api/v1/videos", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });
      console.log("Upload thành công:", response.data);
      resetForm();
      setFileInputKey(Date.now());
      setUploadProgress(0);
      navigate("/"); // Quay về trang chủ sau khi upload thành công
    } catch (error) {
      console.error("Lỗi khi upload:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Upload Video</h2>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 cursor-pointer"
          >
            Trang chủ
          </button>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          validateOnBlur={false}
          validateOnChange={false}
        >
          {({ setFieldValue, isSubmitting }) => (
            <Form className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Tiêu đề
                </label>
                <Field
                  name="title"
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <ErrorMessage name="title" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Mô tả
                </label>
                <Field
                  name="description"
                  as="textarea"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows="3"
                />
                <ErrorMessage
                  name="description"
                  component="div"
                  className="mt-1 text-sm text-red-600"
                />
              </div>

              <div>
                <label htmlFor="videoFile" className="block text-sm font-medium text-gray-700">
                  Chọn video
                </label>
                <input
                  key={fileInputKey}
                  id="videoFile"
                  name="videoFile"
                  type="file"
                  accept="video/*"
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  onChange={(event) => {
                    setFieldValue("videoFile", event.currentTarget.files[0]);
                  }}
                />
                <ErrorMessage
                  name="videoFile"
                  component="div"
                  className="mt-1 text-sm text-red-600"
                />
              </div>

              {uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                  <p className="text-sm text-gray-600 mt-1">{uploadProgress}%</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 cursor-pointer"
              >
                {isSubmitting ? "Đang upload..." : "Upload Video"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

export default VideoUpload;