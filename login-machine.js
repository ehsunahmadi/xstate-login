import { createMachine, interpret, assign } from "xstate";

const randomFetch = () => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      if (Math.random() < 0.5) {
        rej("Fetch failed!");
      } else {
        res("Fetch succeeded!");
      }
    }, 2000);
  });
};

const authMachine = createMachine(
  {
    id: "authMachine",
    initial: "checkingAuth",
    context: {
      mobileNumber: undefined,
      code: undefined,
      authToken: undefined,
      nickname: undefined,
    },
    states: {
      checkingAuth: {
        on: {
          "": [
            {
              target: "authorized",
              cond: "isAuthorized",
            },
            {
              target: "unauthorized",
            },
          ],
        },
      },
      unauthorized: {
        initial: "enterMobile",
        id: "login",
        states: {
          enterMobile: {
            on: {
              REQUEST_CODE: {
                target: "checkingMobile",
                actions: "setMobileNumber",
              },
            },
          },
          checkingMobile: {
            invoke: {
              src: "randomFetch",
              onDone: "enterCode",
              onError: "enterCode",
            },
          },
          enterCode: {
            on: {
              CHECK_CODE: {
                target: "checkingCode",
                actions: "setCode",
              },
            },
          },
          checkingCode: {
            invoke: {
              src: "randomFetch",
              onDone: "enterNickname",
              onError: "enterNickname",
            },
          },
          enterNickname: {
            on: {
              REGISTER: { target: "registering", actions: "setNickname" },
            },
          },
          registering: {
            invoke: {
              src: "randomFetch",
              onDone: "loggingIn",
              onError: "loggingIn",
            },
          },
          loggingIn: {
            invoke: {
              src: "randomFetch",
              onDone: "success",
              onError: "err",
            },
          },
          success: { type: "final" },
          err: { type: "final" },
        },
        onDone: "authorized",
      },
      authorized: { type: "final" },
    },
  },
  {
    services: {
      randomFetch: () => {
        return randomFetch;
      },
    },
    actions: {
      setMobileNumber: assign((context, event) => ({
        mobileNumber: event.payload.mobileNumber,
      })),
      setCode: assign((context, event) => ({
        code: event.payload.code,
        authToken: event.payload.authToken,
      })),
      setNickname: assign((context, event) => ({
        nickname: event.payload.nickname,
      })),
    },
    guards: {
      isAuthorized: (context, event) => {
        return JSON.parse(!!localStorage.getItem("refreshToken"));
      },
    },
  }
);

const loginService = interpret(authMachine);

loginService.onTransition((state) => {
  console.log(state.value, state.context);
});

loginService.start();

loginService.send({
  type: "REQUEST_CODE",
  payload: {
    mobileNumber: "09901157601",
  },
});

setTimeout(() => {
  loginService.send({
    type: "CHECK_CODE",
    payload: {
      code: "12345",
      authToken: "agfuyt2i23r78",
    },
  });
}, 3000);
setTimeout(() => {
  loginService.send({
    type: "REGISTER",
    payload: {
      nickname: "ali",
    },
  });
}, 6000);
