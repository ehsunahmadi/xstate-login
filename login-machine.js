import { createMachine, interpret, assign } from "xstate";
import regeneratorRuntime from "regenerator-runtime";

const randomFetch = fetch("https://jsonplaceholder.typicode.com/posts", {
  method: "POST",
  body: JSON.stringify({
    title: "foo",
    body: "bar",
    userId: 1,
  }),
  headers: {
    "Content-type": "application/json; charset=UTF-8",
  },
})
  .then((response) => response.json())
  .then((json) => {
    return json;
  });

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
              onDone: [
                {
                  target: "enterNickname",
                  actions: "onCodeSuccess",
                  cond: "notRegistered",
                },
                { target: "loggingIn" },
              ],
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
              onDone: { target: "loggingIn", actions: "onRegister" },
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
      randomFetch: async () => {
        return await randomFetch;
      },
      checkCode: async (context, event) => {
        const res = await Api.invoke("post", "/core/v1/auth/requestCode", {
          mobileNumber: event.mobileNumber,
        });
        return res;
      },
    },
    actions: {
      setMobileNumber: assign((context, event) => ({
        mobileNumber: event.payload.mobileNumber,
      })),
      setCode: assign((context, event) => ({
        code: event.payload.code,
      })),
      setNickname: assign((context, event) => ({
        nickname: event.payload.nickname,
      })),
      onCodeSuccess: assign((context, event) => ({
        authToken: event.data.title,
      })),
      onRegister: assign((context, event) => ({
        authToken: event.data.body,
      })),
    },
    guards: {
      isAuthorized: (context, event) => {
        return JSON.parse(!!localStorage.getItem("refreshToken"));
      },
      notRegistered: (context, event) => {
        return event.data.userId === 1;
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
