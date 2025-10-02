export const checkRequiredSteps = (userData: any) => {
  const identityCompleted =
    !!userData?.identityVerification?.frontId?.url &&
    !!userData?.identityVerification?.backId?.url &&
    !!userData?.identityVerification?.selfieWithId?.url;

  const phoneCompleted =
    !!userData?.phoneNumber &&
    userData?.phoneNumber.trim() !== "" &&
    userData?.phoneVerified === true;

  return {
    identityCompleted,
    phoneCompleted,
    allStepsCompleted: identityCompleted && phoneCompleted,
  };
};
